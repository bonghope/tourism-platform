import { createRouter, createWebHistory } from 'vue-router';
import Home from '../pages/client/Home.vue';
import Tours from '../pages/client/Tours.vue';
import About from '../pages/client/About.vue';
import TourDetail from '../pages/client/TourDetail.vue';
import Destinations from '../pages/client/Destinations.vue';
import DestinationDetail from '../pages/client/DestinationDetail.vue';
import Wishlist from '../pages/client/Wishlist.vue';

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
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
