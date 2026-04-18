import React from 'react';
import ReactDOM from 'react-dom';

if (typeof window !== 'undefined' && !(window as any).__BEELIBER_SHIMMED__) {
    (window as any).React = React;
    (window as any).ReactDOM = ReactDOM;
    (window as any).__BEELIBER_SHIMMED__ = true;
}
