import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/source-sans-3/latin-400.css';
import '@fontsource/source-sans-3/latin-600.css';
import { App, AboutPage, NotFoundPage, RequireAuth } from './app/App.jsx';
import { AuthPage } from './features/auth/AuthPage.jsx';
import { DiscoverPage } from './features/discover/DiscoverPage.jsx';
import { ComposePage } from './features/moodspaces/ComposePage.jsx';
import { SpacePage } from './features/moodspaces/SpacePage.jsx';
import { ListenPage } from './features/player/ListenPage.jsx';
import './styles/app.css';

const router = createBrowserRouter([{ element: <App />, errorElement: <div className="page-shell"><h1>Something interrupted this space.</h1><p>Please reload the page and try again.</p><a href="/">Return home</a></div>, children: [
  { path: '/', element: <Navigate to="/discover" replace /> },
  { path: '/auth', element: <AuthPage /> },
  { path: '/about', element: <AboutPage /> },
  { element: <RequireAuth />, children: [
    { path: '/discover', element: <DiscoverPage /> },
    { path: '/listen', element: <ListenPage /> },
    { path: '/compose', element: <Navigate to="/compose/new" replace /> },
    { path: '/compose/new', element: <ComposePage /> },
    { path: '/compose/:id', element: <ComposePage /> },
    { path: '/spaces/:id', element: <SpacePage /> }
  ] },
  { path: '*', element: <NotFoundPage /> }
] }]);

createRoot(document.getElementById('root')).render(<React.StrictMode><RouterProvider router={router} /></React.StrictMode>);
