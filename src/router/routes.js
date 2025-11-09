// --- NEW: Import the auth store ---
import { useAuthStore } from 'stores/auth';

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      {
        path: '/recipe/:id',
        component: () => import('pages/RecipePage.vue'),
      },
      {
        path: '/submit',
        component: () => import('pages/SubmitPage.vue'),
      },
      {
        path: '/my-submissions',
        component: () => import('pages/MySubmissionsPage.vue'),
      },
      // --- NEW ADMIN ROUTE (Correctly nested as a child) ---
      {
        path: '/admin',
        component: () => import('pages/AdminPage.vue'),
        // --- This is the Navigation Guard ---
        beforeEnter: (to, from, next) => {
          const authStore = useAuthStore();
          if (authStore.isAdmin) {
            next(); // User is admin, proceed
          } else {
            next('/'); // User is not admin, redirect to home
          }
        },
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
