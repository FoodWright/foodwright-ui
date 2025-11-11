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
      {
        path: '/my-cookbook',
        component: () => import('pages/MyCookbookPage.vue'),
        props: (route) => ({ tab: route.query.tab || 'favorites' }),
      },
      {
        path: '/my-cookbook/private/new',
        component: () => import('pages/EditRecipePage.vue'),
      },
      {
        path: '/my-cookbook/private/edit/:id',
        component: () => import('pages/EditRecipePage.vue'),
      },
      {
        path: '/user/:id',
        component: () => import('pages/UserProfilePage.vue'),
      },
      {
        path: '/admin',
        component: () => import('pages/AdminPage.vue'),
        beforeEnter: (to, from, next) => {
          const authStore = useAuthStore();
          // Need to check this on page load
          if (authStore.isAdmin) {
            next();
          } else {
            // In case of page refresh, auth might not be ready.
            // A better guard would watch authStore, but for now
            // we'll just deny. A real app would wait.
            if (authStore.user) {
              next('/'); // Not admin
            } else {
              next('/'); // Not logged in
            }
          }
        },
      },
      // --- NEW: Site Admin Route ---
      {
        path: '/site-admin',
        component: () => import('pages/SiteAdminPage.vue'),
        beforeEnter: (to, from, next) => {
          const authStore = useAuthStore();
          if (authStore.isSiteAdmin) {
            next(); // User is Site Admin, proceed
          } else {
            if (authStore.user) {
              next('/'); // Not site admin
            } else {
              next('/'); // Not logged in
            }
          }
        },
      },
      // ---
    ],
  },

  // Always leave this as last one
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
