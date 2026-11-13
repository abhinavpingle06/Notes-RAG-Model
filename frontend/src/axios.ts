import axios from "axios";

const express_url = import.meta.env.VITE_EXPRESS_URL
export const express_api = axios.create({
    baseURL: express_url,
    timeout: 12000,
})