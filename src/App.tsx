/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DaybookProvider } from './context/DaybookContext';
import { AppShell } from './components/layout/AppShell';

export default function App() {
  return (
    <DaybookProvider>
      <AppShell />
    </DaybookProvider>
  );
}
