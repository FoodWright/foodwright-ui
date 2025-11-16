import { useAuthStore } from 'stores/auth';

// --- NEW: Reusable Route Guards ---

/**
 * Waits for auth to be ready, then checks if a user is logged in.
 * If not, redirects to /login.
 */
const requireAuth = (to, from, next) => {
  const authStore = useAuthStore();

  const proceed = () => {
    if (!authStore.user) {
      next('/login'); // Not logged in, redirect
    } else {
      next(); // Logged in, proceed
    }
  };

  if (!authStore.authReady) {
    // Wait for auth to be ready
    const unwatch = authStore.$subscribe((mutation, state) => {
      if (state.authReady) {
        unwatch(); // Stop watching
        proceed();
      }
    });
  } else {
    // Auth is ready, just check
    proceed();
  }
};

/**
 * Waits for auth, then checks if the user is a Guild Admin.
 * If not, redirects to home.
 */
const requireAdmin = (to, from, next) => {
  const authStore = useAuthStore();

  const proceed = () => {
    if (authStore.user && authStore.isAdmin) {
      next(); // Is admin, proceed
    } else {
      next('/'); // Not admin, redirect to home
    }
  };

  if (!authStore.authReady) {
    const unwatch = authStore.$subscribe((mutation, state) => {
      if (state.authReady) {
        unwatch();
        proceed();
      }
    });
  } else {
    proceed();
  }
};

/**
 * Waits for auth, then checks if the user is a Site Admin.
 * If not, redirects to home.
 */
const requireSiteAdmin = (to, from, next) => {
  const authStore = useAuthStore();

  const proceed = () => {
    if (authStore.user && authStore.isSiteAdmin) {
      next(); // Is site admin, proceed
    } else {
      next('/'); // Not site admin, redirect to home
    }
  };

  if (!authStore.authReady) {
    const unwatch = authStore.$subscribe((mutation, state) => {
      if (state.authReady) {
        unwatch();
        proceed();
      }
    });
  } else {
    proceed();
  }
};
// --- END: Reusable Route Guards ---

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    // --- DELETED: The site-wide beforeEnter guard ---
    children: [
      // --- Public Routes ---
      { path: '', component: () => import('pages/IndexPage.vue') },
      {
        path: '/recipe/:id',
        component: () => import('pages/RecipePage.vue'),
      },
      {
        path: '/user/:id',
        component: () => import('pages/UserProfilePage.vue'),
      },
      // --- NEW: Converter Tool Route ---
      {
        path: '/tools/converter',
        component: () => import('pages/ConverterToolPage.vue'),
      },
      // ---

      // --- Private User Routes (Require Login) ---

      // === MODIFICATION: Delete this entire route block ===
      /*
      {
        path: '/submit',
        component: () => import('pages/SubmitPage.vue'),
        beforeEnter: requireAuth, // <-- ADDED guard
      },
      */
      // === END MODIFICATION ===

      {
        path: '/my-submissions',
        component: () => import('pages/MySubmissionsPage.vue'),
        beforeEnter: requireAuth, // <-- ADDED guard
      },
      {
        path: '/my-cookbook',
        component: () => import('pages/MyCookbookPage.vue'),
        props: (route) => ({ tab: route.query.tab || 'favorites' }),
        beforeEnter: requireAuth, // <-- ADDED guard
      },
      {
        path: '/my-cookbook/private/new',
        component: () => import('pages/EditRecipePage.vue'),
        beforeEnter: requireAuth, // <-- ADDED guard
      },
      {
        path: '/my-cookbook/private/edit/:id',
        component: () => import('pages/EditRecipePage.vue'),
        beforeEnter: requireAuth, // <-- ADDED guard
      },

      // --- Admin Routes (Already guarded, but updated to new function) ---
      {
        path: '/admin',
        component: () => import('pages/AdminPage.vue'),
        beforeEnter: requireAdmin, // <-- UPDATED to new guard
      },
      {
        path: '/site-admin',
        component: () => import('pages/SiteAdminPage.vue'),
        beforeEnter: requireSiteAdmin, // <-- UPDATED to new guard
      },
    ],
  },

  // --- Login Page Route (Unchanged) ---
  {
    path: '/login',
    component: () => import('pages/LoginPage.vue'),
    beforeEnter: (to, from, next) => {
      const authStore = useAuthStore();
      // If user is already logged in, send them home
      // We can use authReady for a faster check
      if (authStore.authReady && authStore.user) {
        next('/');
      } else if (!authStore.authReady) {
        // Wait for auth check if not ready
        const unwatch = authStore.$subscribe((mutation, state) => {
          if (state.authReady) {
            unwatch();
            if (state.user) {
              next('/');
            } else {
              next();
            }
          }
        });
      } else {
        next(); // Auth is ready and no user
      }
    },
  },

  // Always leave this as last one
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
