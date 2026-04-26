import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api",
    headers: { "Content-Type": "application/json" },
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ── Auth ──────────────────────────────────────────────
export const loginUser = async (username, password) => {
    const { data } = await api.post("/token/", { username, password });
    return data; // { access, refresh }
};

export const registerUser = async (formData) => {
    const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password2: formData.password2,
        first_name: formData.first_name,
        last_name: formData.last_name,
        ...(formData.phone && { phone: formData.phone }),
    };
    const { data } = await api.post("/users/register/", payload);
    return data;
};

export const refreshToken = async (refresh) => {
    const { data } = await api.post("/token/refresh/", { refresh });
    return data; // { access }
};

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

// ── Appointments ──────────────────────────────────────
export const getAppointments = () =>
    api.get("/appointments/").then((r) => r.data);
export const createAppointment = (appt) =>
    api.post("/appointments/", appt).then((r) => r.data);
export const updateAppointment = (id, appt) =>
    api.put(`/appointments/${id}/`, appt).then((r) => r.data);
export const cancelAppointment = (id) => api.delete(`/appointments/${id}/`);

// ── Clinics ───────────────────────────────────────────
export const getClinics = () => api.get("/clinics/").then((r) => r.data);

export default api;

// ── Vaccines ──────────────────────────────────────────
export const getVaccines = () => api.get("/vaccines/").then((r) => r.data);

// ── Profile ───────────────────────────────────────────
export const getProfile = () => api.get("/users/profile/").then((r) => r.data);

// ── Visits ────────────────────────────────────────────
export const getVisits = () => api.get("/visits/").then((r) => r.data);
export const createVisit = (visit) => api.post("/visits/", visit).then((r) => r.data);

// ── Appointments (vet actions) ─────────────────────────
export const confirmAppointment = (id) => api.patch(`/appointments/${id}/confirm/`).then((r) => r.data);
