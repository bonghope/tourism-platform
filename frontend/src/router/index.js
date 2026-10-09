import { createRouter, createWebHistory } from 'vue-router';
import Home from '../components/Home.vue';
import Tours from '../components/Tours.vue';
import About from '../components/About.vue';
import TourDetail from '../components/TourDetail.vue';
import Destinations from '../components/Destinations.vue';
import DestinationDetail from '../components/DestinationDetail.vue';
import Wishlist from '../components/Wishlist.vue';
import UserProfile from '../components/UserProfile.vue';

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/about',
        name: 'About',
        component: About
    },
    {
        path: '/tours',
        name: 'Tours',
        component: Tours
    },
    {
        path: '/tour/:id',
        name: 'TourDetail',
        component: TourDetail
    },
    {
        path: '/destinations',
        name: 'Destinations',
        component: Destinations
    },
    {
        path: '/destination/:id',
        name: 'DestinationDetail',
        component: DestinationDetail
    },
    {
        path: '/wishlist',
        name: 'Wishlist',
        component: Wishlist
    },
    {
        path: '/profile',
        name: 'UserProfile',
        component: UserProfile
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

export default router;
