import fs from 'node:fs/promises';

const supabaseUrl = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const serviceRoleJwt = (process.env.SUPABASE_SERVICE_ROLE_JWT || '').trim();
const healthReportPath =
  process.env.ADMIN_LOGIN_HEALTH_REPORT_PATH
  || '/Users/cm/Desktop/beeliber/beeliber-main/docs/ADMIN_LOGIN_HEALTH_REPORT.json';
const inventoryCsvPath =
  process.env.SUPABASE_LOGIN_INVENTORY_CSV_PATH
  || '/Users/cm/Desktop/beeliber/beeliber-main/docs/SUPABASE_PHASE1_LOGIN_INVENTORY.csv';

if (!supabaseUrl || !serviceRoleJwt) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_JWT are required.');
  process.exit(1);
}

const normalizeText = (value) => String(value || '').trim();
const normalizeLower = (value) => normalizeText(value).toLowerCase();

const parseCsvLine = (line) => {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
};

const parseJsonResponse = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
};

const requestSupabase = async (path, options = {}) => {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: serviceRoleJwt,
      Authorization: `Bearer ${serviceRoleJwt}`,
      'Content-Type': 'application/json',
      'Accept-Profile': 'public',
      'Content-Profile': 'public',
      ...(options.headers || {}),
    },
  });

  const body = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(
      typeof body === 'object' && body && 'message' in body
        ? String(body.message)
        : `Supabase request failed (${response.status})`
    );
  }

  return body;
};

const buildTargetMappings = async () => {
  const report = JSON.parse(await fs.readFile(healthReportPath, 'utf8'));
  const csvLines = (await fs.readFile(inventoryCsvPath, 'utf8'))
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows = [];

  for (const row of report.healthyRows || []) {
    const email = normalizeLower(row.authEmail);
    const identifier = normalizeText(row.identifierValue);
    if (!email || !identifier) continue;
    rows.push({
      email,
      loginId: identifier,
      synthetic: email.endsWith('@staff.bee-liber.invalid'),
    });
  }

  for (const line of csvLines.slice(1)) {
    const [name, loginEmail, synthetic, , branchCode] = parseCsvLine(line);
    const normalizedEmail = normalizeLower(loginEmail);
    if (!normalizedEmail) continue;

    if (normalizedEmail === 'ceo@bee-liber.com') {
      rows.push({ email: normalizedEmail, loginId: 'admin', name, synthetic: false });
      continue;
    }

    if (normalizeLower(synthetic) === 'yes') {
      continue;
    }

    const normalizedBranchCode = normalizeText(branchCode);
    if (normalizedBranchCode) {
      rows.push({ email: normalizedEmail, loginId: normalizedBranchCode, name, synthetic: false });
    }
  }

  const preferredByLoginId = new Map();
  for (const row of rows) {
    const key = normalizeLower(row.loginId);
    const existing = preferredByLoginId.get(key);
    if (!existing || (existing.synthetic && !row.synthetic)) {
      preferredByLoginId.set(key, row);
    }
  }

  const deduped = new Map();
  for (const row of preferredByLoginId.values()) {
    if (!deduped.has(row.email)) {
      deduped.set(row.email, row.loginId);
    }
  }

  return deduped;
};

const main = async () => {
  const mappings = await buildTargetMappings();
  const targetEmails = [...mappings.keys()];
  const updates = [];
  const skipped = [];

  for (const email of targetEmails) {
    const encodedEmail = encodeURIComponent(email);
    const rows = await requestSupabase(
      `/rest/v1/employees?select=id,name,email,login_id&email=eq.${encodedEmail}&limit=1`
    );
    const employee = rows[0];
    if (!employee?.id) {
      skipped.push(`${email} -> employee not found`);
      continue;
    }

    const desiredLoginId = mappings.get(email);
    const currentLoginId = normalizeText(employee.login_id);

    if (currentLoginId === desiredLoginId) {
      skipped.push(`${email} -> already ${desiredLoginId}`);
      continue;
    }

    const conflictingRows = await requestSupabase(
      `/rest/v1/employees?select=id,email,login_id&login_id=eq.${encodeURIComponent(desiredLoginId)}&limit=10`
    );
    for (const row of conflictingRows) {
      if (!row?.id || row.id === employee.id) continue;
      await requestSupabase(
        `/rest/v1/employees?id=eq.${encodeURIComponent(row.id)}`,
        {
          method: 'PATCH',
          headers: {
            Prefer: 'return=representation',
          },
          body: JSON.stringify({
            login_id: null,
          }),
        }
      );
    }

    await requestSupabase(
      `/rest/v1/employees?id=eq.${encodeURIComponent(employee.id)}`,
      {
        method: 'PATCH',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          login_id: desiredLoginId,
        }),
      }
    );

    updates.push({
      email,
      loginId: desiredLoginId,
      name: normalizeText(employee.name),
    });
  }

  console.log(JSON.stringify({
    totalMappings: targetEmails.length,
    updated: updates.length,
    skipped: skipped.length,
    updates,
    skippedPreview: skipped.slice(0, 20),
  }, null, 2));
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
