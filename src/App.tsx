/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Project from './pages/Project';
import Pricing from './pages/Pricing';
import Templates from './pages/Templates';
import TemplateEditor from './pages/TemplateEditor';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="project/:id" element={<Project />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="templates" element={<Templates />} />
        <Route path="templates/:id" element={<TemplateEditor />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
