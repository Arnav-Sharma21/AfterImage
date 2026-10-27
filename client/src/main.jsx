import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import { App, AboutPage, NotFoundPage, RequireAuth } from './app/App.jsx';
const AuthPage = React.lazy(() => import('./features/auth/AuthPage.jsx').then(module => ({ default: module.AuthPage })));
const DiscoverPage = React.lazy(() => import('./features/discover/DiscoverPage.jsx').then(module => ({ default: module.DiscoverPage })));
const SearchPage = React.lazy(() => import('./features/discover/SearchPage.jsx').then(module => ({ default: module.SearchPage })));
const ComposePage = React.lazy(() => import('./features/moodspaces/ComposePage.jsx').then(module => ({ default: module.ComposePage })));
const SpacePage = React.lazy(() => import('./features/moodspaces/SpacePage.jsx').then(module => ({ default: module.SpacePage })));
const ListenPage = React.lazy(() => import('./features/player/ListenPage.jsx').then(module => ({ default: module.ListenPage })));
import './styles/app.css';

const router = createBrowserRouter([{ element: <App />, errorElement: <div className="page-shell"><h1>Something interrupted this space.</h1><p>Please reload the page and try again.</p><a href="/">Return home</a></div>, children: [
  { path: '/', element: <Navigate to="/atlas" replace /> },
  { path: '/auth', element: <AuthPage /> },
  { path: '/about', element: <AboutPage /> },
  { element: <RequireAuth />, children: [
    { path: '/atlas', element: <DiscoverPage /> },
    { path: '/signals', element: <SearchPage /> },
    { path: '/worlds/new', element: <ComposePage /> },
    { path: '/worlds/:id', element: <SpacePage /> },
    { path: '/worlds/:id/edit', element: <ComposePage /> },
    { path: '/player', element: <ListenPage /> },
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
