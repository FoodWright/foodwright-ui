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
        // Read tab from query param
        props: (route) => ({ tab: route.query.tab || 'favorites' }),
      },
      // --- NEW PRIVATE RECIPE ROUTES ---
      {
        path: '/my-cookbook/private/new',
        component: () => import('pages/EditRecipePage.vue'),
      },
      {
        path: '/my-cookbook/private/edit/:id',
        component: () => import('pages/EditRecipePage.vue'),
      },
      // ---
      {
        path: '/user/:id',
        component: () => import('pages/UserProfilePage.vue'),
      },
      {
        path: '/admin',
        component: () => import('pages/AdminPage.vue'),
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

  // Always leave this as last one
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
