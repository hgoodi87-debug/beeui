import React from 'react';
import ReactDOM from 'react-dom';

if (typeof window !== 'undefined') {
    (window as any).React = React;
    (window as any).ReactDOM = ReactDOM;
    console.log('Global React & ReactDOM shimmed successfully. 💅');
}
