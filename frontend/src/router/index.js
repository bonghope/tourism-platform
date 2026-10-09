import { createRouter, createWebHistory } from 'vue-router';
import Home from '../components/Home.vue';
import Tours from '../components/Tours.vue';
import About from '../components/About.vue';
import TourDetail from '../components/TourDetail.vue';
import Destinations from '../components/Destinations.vue';
import DestinationDetail from '../components/DestinationDetail.vue';
import Wishlist from '../components/Wishlist.vue';
import UserProfile from '../components/UserProfile.vue';

import BookingCheckout from '../components/BookingCheckout.vue';
const routes = [
    { path: '/bookings', name: 'BookingHistory', component: () => import('../components/BookingHistory.vue') },
    { path: '/bookings/:bookingId', name: 'InvoiceDetail', component: () => import('../components/InvoiceDetail.vue') },
    { path: '/payment/:bookingId', name: 'Payment', component: () => import('../components/PaymentPage.vue') },
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
    },
    {
    path: '/booking/:id',
    name: 'BookingCheckout',
    component: BookingCheckout
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

export default router;
