import axios from "axios";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const API_BASE_URL = `${API_ORIGIN}/api`;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
});

const clearAuthTokens = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
};

let refreshRequest = null;

// Adjunta el JWT vigente en cada solicitud.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Renueva el access token automáticamente cuando vence.
// Se usa una única solicitud de refresh para evitar carreras si varias peticiones
// reciben 401 al mismo tiempo al volver a abrir la app.
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config || {};
        const isUnauthorized = error.response?.status === 401;
        const isRefreshRequest = String(original.url || "").includes("/users/token/refresh/");

        if (!isUnauthorized || original._retry || isRefreshRequest) {
            return Promise.reject(error);
        }

        const access = localStorage.getItem("access_token");
        const refresh = localStorage.getItem("refresh_token");

        // Un visitante sin sesión puede seguir usando las rutas públicas.
        if (!access && !refresh) return Promise.reject(error);

        original._retry = true;

        if (!refresh) {
            clearAuthTokens();
            if (window.location.pathname !== "/login") {
                window.location.replace("/login?session=expired");
            }
            return Promise.reject(error);
        }

        try {
            if (!refreshRequest) {
                refreshRequest = axios
                    .post(`${API_BASE_URL}/users/token/refresh/`, { refresh })
                    .then(({ data }) => {
                        localStorage.setItem("access_token", data.access);
                        return data.access;
                    })
                    .finally(() => {
                        refreshRequest = null;
                    });
            }

            const newAccess = await refreshRequest;
            original.headers = {
                ...(original.headers || {}),
                Authorization: `Bearer ${newAccess}`,
            };
            return api(original);
        } catch (refreshError) {
            clearAuthTokens();
            if (window.location.pathname !== "/login") {
                window.location.replace("/login?session=expired");
            }
            return Promise.reject(refreshError);
        }
    }
);

// ── Auth ──────────────────────────────────────────────
export const loginUser = async (username, password) => {
const { data } = await api.post("/users/login/", { username, password });
return data;
};

export const registerUser = async (formData) => {
const payload = {
    username: formData.username,
    email: formData.email,
    password: formData.password,
    password2: formData.password2,
    first_name: formData.first_name,
    last_name: formData.last_name,
    role: formData.role,
    ...(formData.phone && { phone: formData.phone }),
    ...(formData.province && { province: formData.province }),
    ...(formData.locality && { locality: formData.locality }),
};
const { data } = await api.post("/users/register/", payload);
return data;
};

export const refreshToken = async (refresh) => {
const { data } = await api.post("/users/token/refresh/", { refresh });
return data;
};

// ── Profile ───────────────────────────────────────────
export const getProfile = () => api.get("/users/profile/").then((r) => r.data);

// ── Pets ──────────────────────────────────────────────
export const getPets = () => api.get("/pets/").then((r) => r.data);

export const createPet = (petData) => {
const formData = new FormData();
Object.entries(petData).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
    formData.append(key, value);
    }
});
return api.post("/pets/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
}).then((r) => r.data);
};

export const updatePet = (id, petData) => {
const formData = new FormData();
Object.entries(petData).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
    formData.append(key, value);
    }
});
return api.patch(`/pets/${id}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
}).then((r) => r.data);
};

export const deletePet = (id) => api.delete(`/pets/${id}/`);

// ── Anuncios / publicidades ───────────────────────────
export const getActiveAds = () => api.get("/ads/active/").then((r) => r.data);
export const getAds = () => api.get("/ads/").then((r) => r.data);

// Registra un click de un anuncio (sin bloquear: si falla, no pasa nada)
export const registerAdClick = (id) => api.post(`/ads/${id}/click/`).catch(() => {});

const buildAdForm = (adData) => {
    const formData = new FormData();
    Object.entries(adData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
            formData.append(key, value);
        }
    });
    return formData;
};

export const createAd = (adData) =>
    api.post("/ads/", buildAdForm(adData), {
        headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);

export const updateAd = (id, adData) =>
    api.patch(`/ads/${id}/`, buildAdForm(adData), {
        headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);

export const deleteAd = (id) => api.delete(`/ads/${id}/`);

// ── Blog ──────────────────────────────────────────────
export const getPublishedPosts = () => api.get("/blog/published/").then((r) => r.data);
export const getPostBySlug = (slug) => api.get(`/blog/post/${slug}/`).then((r) => r.data);
export const getPosts = () => api.get("/posts/").then((r) => r.data); // admin: todas
export const createPost = (postData) =>
    api.post("/posts/", buildAdForm(postData), {
        headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
export const updatePost = (id, postData) =>
    api.patch(`/posts/${id}/`, buildAdForm(postData), {
        headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
export const deletePost = (id) => api.delete(`/posts/${id}/`);

// ── Appointments ──────────────────────────────────────
export const getAppointments = () => api.get("/appointments/").then((r) => r.data);
export const createAppointment = (appt) => api.post("/appointments/", appt).then((r) => r.data);
export const updateAppointment = (id, appt) => api.put(`/appointments/${id}/`, appt).then((r) => r.data);
export const cancelAppointment = (id) => api.patch(`/appointments/${id}/cancel/`).then((r) => r.data);
export const confirmAppointment = (id) => api.patch(`/appointments/${id}/confirm/`).then((r) => r.data);
export const markNotificationsSeen = () => api.post("/appointments/mark_seen/").then((r) => r.data);
export const getClinicNotifications = () => api.get("/appointments/?seen_by_clinic=false").then((r) => r.data);
export const markClinicNotificationsSeen = () => api.post("/appointments/mark_seen_clinic/").then((r) => r.data);
export const markNoShow = (id) => api.patch(`/appointments/${id}/mark_no_show/`).then((r) => r.data);

// ── Clinics ───────────────────────────────────────────
export const getClinics = () => api.get("/clinics/").then((r) => r.data);
export const joinClinic = (id) => api.post(`/clinics/${id}/join/`).then((r) => r.data);


// ── Negocios y refugios VetPaw ──────────────────────
const buildPartnerForm = (profileData) => {
    const formData = new FormData();
    Object.entries(profileData || {}).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (typeof File !== 'undefined' && value instanceof File) {
            formData.append(key, value);
        } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
            formData.append(key, JSON.stringify(value));
        } else {
            formData.append(key, value);
        }
    });
    return formData;
};

export const getBusinesses = (params = {}) =>
    api.get('/businesses/', { params }).then((r) => r.data);
export const getBusinessProfile = (slug) =>
    api.get(`/businesses/${slug}/`).then((r) => r.data);
export const getMyBusinessProfile = () =>
    api.get('/businesses/me/').then((r) => r.data);
export const updateMyBusinessProfile = (profileData) =>
    api.patch('/businesses/me/', buildPartnerForm(profileData), {
        headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);

export const getShelters = (params = {}) =>
    api.get('/shelters/', { params }).then((r) => r.data);
export const getShelterProfile = (slug) =>
    api.get(`/shelters/${slug}/`).then((r) => r.data);
export const getMyShelterProfile = () =>
    api.get('/shelters/me/').then((r) => r.data);
export const updateMyShelterProfile = (profileData) =>
    api.patch('/shelters/me/', buildPartnerForm(profileData), {
        headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);

// ── Visits ────────────────────────────────────────────
export const getVisits = () => api.get("/visits/").then((r) => r.data);
export const createVisit = (visit) => api.post("/visits/", visit).then((r) => r.data);

// ── Vaccines ──────────────────────────────────────────
export const getVaccines = () => api.get("/vaccines/").then((r) => r.data);

// ── Tratamientos preventivos (desparasitaria, pulgas, pipeta) ──
export const createTreatment = (data) => api.post("/treatments/", data).then((r) => r.data);
export const deleteTreatment = (id) => api.delete(`/treatments/${id}/`);

// ── Messages ──────────────────────────────────────────
export const getConversations  = () => api.get('/messages/conversations/').then(r => r.data)
export const getMessages       = () => api.get('/messages/').then(r => r.data)
export const sendMessage       = (data) => api.post('/messages/', data).then(r => r.data)
export const markMessagesRead  = (other_user_id) => api.post('/messages/mark_read/', { other_user_id }).then(r => r.data)
export const getUnreadCount    = () => api.get('/messages/unread_count/').then(r => r.data)

// ── Password Reset ────────────────────────────────────
export const requestPasswordReset = (email) =>
    api.post("/users/password-reset/", { email }).then(r => r.data);

export const confirmPasswordReset = (uidb64, token, password, password2) =>
    api.post(`/users/password-reset-confirm/${uidb64}/${token}/`, { password, password2 }).then(r => r.data);



// ── Cumpleaños VetPaw ────────────────────────────────
export const getBirthdayCelebrations = (unread = false) =>
    api.get(`/birthday-celebrations/${unread ? '?unread=true' : ''}`).then((r) => r.data);
export const getCurrentBirthdayCelebrations = () =>
    api.get('/birthday-celebrations/current/').then((r) => r.data);
export const openBirthdayGift = (id) =>
    api.post(`/birthday-celebrations/${id}/open-gift/`).then((r) => r.data);
export const markBirthdayCelebrationRead = (id) =>
    api.post(`/birthday-celebrations/${id}/mark-read/`).then((r) => r.data);
export const markAllBirthdayCelebrationsRead = () =>
    api.post('/birthday-celebrations/mark-all-read/').then((r) => r.data);
export const markBirthdayCardDownloaded = (id) =>
    api.post(`/birthday-celebrations/${id}/card-downloaded/`).then((r) => r.data);

// ── VetPaw Comunidad ─────────────────────────────────
export const getCommunityPosts = (params = {}) =>
    api.get('/community/posts/', { params }).then((r) => r.data);

export const getCommunityPost = (id) =>
    api.get(`/community/posts/${id}/`).then((r) => r.data);

export const createCommunityPost = ({ text, image, pet, commentPermission, clinicContentType, clinicCampaignId }) => {
    const formData = new FormData();
    if (text) formData.append('text', text);
    if (image) formData.append('image', image);
    if (pet) formData.append('pet', pet);
    if (commentPermission) formData.append('comment_permission', commentPermission);
    if (clinicContentType) formData.append('clinic_content_type', clinicContentType);
    if (clinicCampaignId) formData.append('clinic_campaign_id', clinicCampaignId);
    return api.post('/community/posts/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
};

export const updateCommunityPost = (id, { text, image, commentPermission } = {}) => {
    const formData = new FormData();
    if (text !== undefined) formData.append('text', text);
    if (image !== undefined && image !== null) formData.append('image', image);
    if (commentPermission !== undefined) formData.append('comment_permission', commentPermission);
    return api.patch(`/community/posts/${id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
};

export const deleteCommunityPost = (id) =>
    api.delete(`/community/posts/${id}/`);

export const registerCommunityShare = (id) =>
    api.post(`/community/posts/${id}/share/`).then((r) => r.data);

export const toggleCommunityReaction = (id) =>
    api.post(`/community/posts/${id}/react/`).then((r) => r.data);

export const toggleSavedCommunityPost = (id) =>
    api.post(`/community/posts/${id}/save_post/`).then((r) => r.data);

export const getCommunityComments = (postId) =>
    api.get(`/community/posts/${postId}/comments/`).then((r) => r.data);

export const addCommunityComment = (postId, text, parentId = null) =>
    api.post(`/community/posts/${postId}/comments/`, {
        text,
        ...(parentId ? { parent_id: parentId } : {}),
    }).then((r) => r.data);

export const updateCommunityComment = (id, text) =>
    api.patch(`/community/comments/${id}/`, { text }).then((r) => r.data);

export const deleteCommunityComment = (id) =>
    api.delete(`/community/comments/${id}/`);

export const toggleCommunityCommentReaction = (id) =>
    api.post(`/community/comments/${id}/react/`).then((r) => r.data);

export const hideCommunityComment = (id) =>
    api.post(`/community/comments/${id}/hide/`).then((r) => r.data);

export const getCommunityMentionSuggestions = (query) =>
    api.get('/community/mentions/', { params: { q: query } }).then((r) => r.data);

export const getCommunityDiscover = () =>
    api.get('/community/discover/').then((r) => r.data);

export const getCommunityExplore = (params = {}) =>
    api.get('/community/explore/', { params }).then((r) => r.data);

export const getPublicPetProfile = (petId) =>
    api.get(`/community/pets/${petId}/`).then((r) => r.data);

export const updatePublicPetProfile = (petId, data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) formData.append(key, value);
    });
    return api.patch(`/community/pets/${petId}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
};

export const togglePetFollow = (petId) =>
    api.post(`/community/pets/${petId}/follow/`).then((r) => r.data);

export const toggleProfileFollow = (profileType, identifier) =>
    api.post(`/community/profiles/${profileType}/${identifier}/follow/`).then((r) => r.data);

export const getProfileConnections = (profileType, identifier, kind = 'followers', page = 1) =>
    api.get(`/community/profiles/${profileType}/${identifier}/connections/`, {
        params: { kind, page, page_size: 20 },
    }).then((r) => r.data);

export const updateClinicSocialProfile = (slug, data) => {
    const formData = new FormData();
    Object.entries(data || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null) formData.append(key, value);
    });
    return api.patch(`/clinics/perfil/${slug}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
};

export const reportCommunityContent = (payload) =>
    api.post('/community/reports/', payload).then((r) => r.data);

export const getCommunityReports = (status = 'pending') =>
    api.get('/community/reports/', { params: status ? { status } : {} }).then((r) => r.data);

export const moderateCommunityReport = (id, decision, notes = '') =>
    api.post(`/community/reports/${id}/moderate/`, { decision, notes }).then((r) => r.data);

export const toggleBlockedCommunityUser = (userId) =>
    api.post('/community/blocks/toggle/', { user_id: userId }).then((r) => r.data);

export const getBlockedCommunityUsers = () =>
    api.get('/community/blocks/').then((r) => r.data);



// ── Privacidad y control de Comunidad ───────────────
export const getCommunityPrivacy = () =>
    api.get('/community/privacy/').then((r) => r.data);

export const updateCommunityPrivacy = (payload) =>
    api.patch('/community/privacy/settings/', payload).then((r) => r.data);

export const updatePetCommunityVisibility = (petId, isPublic) =>
    api.patch(`/community/privacy/pets/${petId}/`, { is_public: isPublic }).then((r) => r.data);

export const getCommunityFollowRequests = (kind = 'received') =>
    api.get('/community/follow-requests/', { params: { kind } }).then((r) => r.data);

export const acceptCommunityFollowRequest = (id) =>
    api.post(`/community/follow-requests/${id}/accept/`).then((r) => r.data);

export const rejectCommunityFollowRequest = (id) =>
    api.post(`/community/follow-requests/${id}/reject/`).then((r) => r.data);

export const cancelCommunityFollowRequest = (id) =>
    api.post(`/community/follow-requests/${id}/cancel/`).then((r) => r.data);

export const getPetCommunityFollowers = (petId) =>
    api.get('/community/privacy/followers/', { params: { pet_id: petId } }).then((r) => r.data);

export const removePetCommunityFollower = (petId, followerId) =>
    api.post('/community/privacy/remove-follower/', { pet_id: petId, follower_id: followerId }).then((r) => r.data);

export const getMutedCommunityUsers = () =>
    api.get('/community/mutes/').then((r) => r.data);

export const toggleMutedCommunityUser = (userId) =>
    api.post('/community/mutes/toggle/', { user_id: userId }).then((r) => r.data);

export const getHiddenCommunityPosts = () =>
    api.get('/community/hidden-posts/').then((r) => r.data);

export const hideCommunityPost = (postId, reason = 'hidden') =>
    api.post('/community/hidden-posts/hide/', { post_id: postId, reason }).then((r) => r.data);

export const restoreHiddenCommunityPost = (id) =>
    api.post(`/community/hidden-posts/${id}/restore/`).then((r) => r.data);

export const getCommunityNotifications = (params = {}) =>
    api.get('/community/notifications/', { params }).then((r) => r.data);

export const getCommunityNotificationsUnreadCount = () =>
    api.get('/community/notifications/unread_count/').then((r) => r.data);

export const markCommunityNotificationRead = (id) =>
    api.post(`/community/notifications/${id}/mark_read/`).then((r) => r.data);

export const markAllCommunityNotificationsRead = () =>
    api.post('/community/notifications/mark_all_read/').then((r) => r.data);


// ── Notificaciones Web Push ──────────────────────────
export const getPushConfig = () =>
    api.get('/community/push/config/').then((r) => r.data);

export const getPushSubscriptionStatus = (endpoint) =>
    api.get('/community/push/status/', { params: { endpoint } }).then((r) => r.data);

export const registerPushSubscription = (payload) =>
    api.post('/community/push/subscribe/', payload).then((r) => r.data);

export const disablePushSubscription = (endpoint) =>
    api.post('/community/push/unsubscribe/', { endpoint }).then((r) => r.data);

export const sendPushTest = (endpoint) =>
    api.post('/community/push/test/', { endpoint }).then((r) => r.data);


export default api;

// ── Adopciones ───────────────────────────────────────
const buildAdoptionForm = (data = {}) => { const f=new FormData(); Object.entries(data).forEach(([k,v])=>{ if(v===undefined||v===null||v==='') return; f.append(k,v) }); return f }
export const getAdoptions=(params={})=>api.get('/adoptions/',{params}).then(r=>r.data)
export const getAdoption=(id)=>api.get(`/adoptions/${id}/`).then(r=>r.data)
export const createAdoption=(data)=>api.post('/adoptions/',buildAdoptionForm(data),{headers:{'Content-Type':'multipart/form-data'}}).then(r=>r.data)
export const updateAdoption=(id,data)=>api.patch(`/adoptions/${id}/`,buildAdoptionForm(data),{headers:{'Content-Type':'multipart/form-data'}}).then(r=>r.data)
export const deleteAdoption=(id)=>api.delete(`/adoptions/${id}/`)
export const shareAdoption=(id)=>api.post(`/adoptions/${id}/share/`).then(r=>r.data)
export const applyForAdoption=(id,data)=>api.post(`/adoptions/${id}/apply/`,data).then(r=>r.data)
export const offerAdoptionHelp=(id,data)=>api.post(`/adoptions/${id}/help/`,data).then(r=>r.data)
export const getMyAdoptionApplications=()=>api.get('/adoptions/applications/mine/').then(r=>r.data)
export const getShelterApplications=()=>api.get('/adoptions/shelter/applications/').then(r=>r.data)
export const updateAdoptionApplication=(id,data)=>api.patch(`/adoptions/applications/${id}/status/`,data).then(r=>r.data)
export const getShelterHelpOffers=()=>api.get('/adoptions/shelter/help-offers/').then(r=>r.data)

// ── Negocios: catálogo, promociones y reservas ───────
const buildCommerceForm = (data = {}) => {
    const form = new FormData()
    Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return
        if (typeof File !== 'undefined' && value instanceof File) form.append(key, value)
        else if (Array.isArray(value)) form.append(key, JSON.stringify(value))
        else form.append(key, value)
    })
    return form
}
export const getBusinessCatalog = (params = {}) => api.get('/commerce/catalog/', { params }).then(r => r.data)
export const getBusinessCatalogItem = id => api.get(`/commerce/catalog/${id}/`).then(r => r.data)
export const createBusinessCatalogItem = data => api.post('/commerce/catalog/', buildCommerceForm(data), { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
export const updateBusinessCatalogItem = (id, data) => api.patch(`/commerce/catalog/${id}/`, buildCommerceForm(data), { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
export const deleteBusinessCatalogItem = id => api.delete(`/commerce/catalog/${id}/`)
export const shareBusinessCatalogItem = id => api.post(`/commerce/catalog/${id}/share/`).then(r => r.data)
export const getBusinessPromotions = (params = {}) => api.get('/commerce/promotions/', { params }).then(r => r.data)
export const createBusinessPromotion = data => api.post('/commerce/promotions/', buildCommerceForm(data), { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
export const updateBusinessPromotion = (id, data) => api.patch(`/commerce/promotions/${id}/`, buildCommerceForm(data), { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
export const deleteBusinessPromotion = id => api.delete(`/commerce/promotions/${id}/`)
export const shareBusinessPromotion = id => api.post(`/commerce/promotions/${id}/share/`).then(r => r.data)
export const toggleBusinessFavorite = (target_type, target_id) => api.post('/commerce/favorites/toggle/', { target_type, target_id }).then(r => r.data)
export const getBusinessFavorites = () => api.get('/commerce/favorites/').then(r => r.data)
export const createBusinessInquiry = data => api.post('/commerce/inquiries/', data).then(r => r.data)
export const getBusinessInquiries = () => api.get('/commerce/inquiries/').then(r => r.data)
export const updateBusinessInquiry = (id, status) => api.patch(`/commerce/inquiries/${id}/`, { status }).then(r => r.data)
export const createBusinessReservation = data => api.post('/commerce/reservations/', data).then(r => r.data)
export const getBusinessReservations = () => api.get('/commerce/reservations/').then(r => r.data)
export const updateBusinessReservationStatus = (id, data) => api.patch(`/commerce/reservations/${id}/status/`, data).then(r => r.data)
export const getBusinessCommerceDashboard = () => api.get('/commerce/dashboard/').then(r => r.data)

// ── Veterinarias en Comunidad ─────────────────────────
const buildClinicCampaignForm = (payload = {}) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        if (Array.isArray(value)) formData.append(key, JSON.stringify(value));
        else formData.append(key, value);
    });
    return formData;
};

export const getClinicCampaigns = (params = {}) =>
    api.get('/clinic-campaigns/', { params }).then((r) => r.data);

export const getClinicCampaign = (id) =>
    api.get(`/clinic-campaigns/${id}/`).then((r) => r.data);

export const createClinicCampaign = (payload) =>
    api.post('/clinic-campaigns/', buildClinicCampaignForm(payload), {
        headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);

export const updateClinicCampaign = (id, payload) =>
    api.patch(`/clinic-campaigns/${id}/`, buildClinicCampaignForm(payload), {
        headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);

export const deleteClinicCampaign = (id) => api.delete(`/clinic-campaigns/${id}/`);

export const publishClinicCampaign = (id, text = '') =>
    api.post(`/clinic-campaigns/${id}/publish/`, { text }).then((r) => r.data);

export const getClinicCommunityStats = () =>
    api.get('/clinic-campaigns/stats/').then((r) => r.data);

// ── Administración de planes veterinarios ─────────────
export const updateClinicPlan = (clinicId, action, { days = 30, notes = '' } = {}) =>
    api.post(`/users/admin/clinic-plan/${clinicId}/`, { action, days, notes }).then((r) => r.data);

