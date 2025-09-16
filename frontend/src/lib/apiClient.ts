// Laravel API Client to replace Supabase
class ApiClient {
  public baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    this.token = localStorage.getItem('auth_token');
  }

  // Set authentication token
  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  // Get authentication headers
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: any }> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return { data: null, error: data };
      }

      return { data, error: null };
    } catch (error) {
      console.error('API request failed:', error);
      return { data: null, error };
    }
  }

  // Authentication methods
  async signUp(email: string, password: string, userData: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        ...userData,
      }),
    });
  }

  async signIn(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(email: string, token: string, password: string, password_confirmation: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, token, password, password_confirmation }),
    });
  }

  async signOut() {
    const result = await this.request('/auth/logout', {
      method: 'POST',
    });
    
    this.setToken(null);
    return result;
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // Data fetching methods
  async get(endpoint: string, params?: Record<string, any>) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`${endpoint}${queryString}`);
  }

  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // Specific API methods for our app
  async getProfiles(params?: any) {
    return this.get('/public/profiles', params);
  }

  async getServices(params?: any) {
    return this.get('/public/services', params);
  }

  async getBookings(params?: any) {
    return this.get('/bookings', params);
  }

  async getOffers(params?: any) {
    return this.get('/offers', params);
  }

  async getMessages(params?: any) {
    return this.get('/messages', params);
  }

  async getNotifications(params?: any) {
    return this.get('/notifications', params);
  }

  async getPayments(params?: any) {
    return this.get('/payments', params);
  }

  async getReviews(params?: any) {
    return this.get('/public/reviews', params);
  }

  async getCategories() {
    return this.get('/public/categories');
  }

  async getWorkerProfiles(params?: any) {
    return this.get('/public/worker-profiles', params);
  }

  async getServiceRequests(params?: any) {
    return this.get('/service-requests', params);
  }

  // Create methods
  async createServiceRequest(data: any) {
    return this.post('/service-requests', data);
  }

  async createOffer(data: any) {
    return this.post('/offers', data);
  }

  async createBooking(data: any) {
    return this.post('/bookings', data);
  }

  async createMessage(data: any) {
    return this.post('/messages', data);
  }

  async createReview(data: any) {
    return this.post('/reviews', data);
  }

  async createPayment(data: any) {
    return this.post('/payments', data);
  }

  // Update methods
  async updateProfile(id: string, data: any) {
    return this.put(`/profiles/${id}`, data);
  }

  async updateServiceRequest(id: string, data: any) {
    return this.put(`/service-requests/${id}`, data);
  }

  async updateOffer(id: string, data: any) {
    return this.put(`/offers/${id}`, data);
  }

  async updateBooking(id: string, data: any) {
    return this.put(`/bookings/${id}`, data);
  }

  async updateMessage(id: string, data: any) {
    return this.put(`/messages/${id}`, data);
  }

  // Delete methods
  async deleteServiceRequest(id: string) {
    return this.delete(`/service-requests/${id}`);
  }

  async deleteOffer(id: string) {
    return this.delete(`/offers/${id}`);
  }

  async deleteBooking(id: string) {
    return this.delete(`/bookings/${id}`);
  }

  async deleteMessage(id: string) {
    return this.delete(`/messages/${id}`);
  }

  async deleteReview(id: string) {
    return this.delete(`/reviews/${id}`);
  }

  // Stripe/Payment methods
  async createCheckout(data: any) {
    return this.post('/create-checkout', data);
  }

  async completePayment(data: any) {
    return this.post('/complete-payment', data);
  }

  async getPaymentStatus(id: string) {
    return this.get(`/get-payment-status/${id}`);
  }

  async verifyPayment(data: any) {
    return this.post('/verify-payment', data);
  }

  // Contact methods
  async getContact() {
    return this.get('/contact');
  }

  async createContact(data: any) {
    return this.post('/contact', data);
  }

  async updateContact(data: any) {
    return this.put('/contact', data);
  }

  // Admin Account Activation methods
  async getAdminAccountActivationRequests() {
    return this.get('/admin/account-activation-requests');
  }

  async updateAccountActivationRequest(requestId: string, data: any) {
    return this.put(`/admin/account-activation-requests/${requestId}`, data);
  }

  async getAdminWorkerAccountStatus(workerId: string) {
    return this.get(`/admin/worker-account-status/${workerId}`);
  }

  async getAdminDeactivatedWorkers() {
    return this.get('/admin/deactivated-workers');
  }

  async deactivateWorker(data: any) {
    return this.post('/admin/deactivate-worker', data);
  }

  async reactivateWorker(data: any) {
    return this.post('/admin/reactivate-worker', data);
  }

  async runPeriodicDeactivationCheck() {
    return this.post('/admin/run-periodic-deactivation-check', {});
  }

  // Email methods
  async sendEmail(data: any) {
    return this.post('/send-email', data);
  }

  async sendWelcomeEmail(data: any) {
    return this.post('/send-welcome-email', data);
  }

  async sendEmailConfirmation(data: any) {
    return this.post('/send-email-confirmation', data);
  }

  // Worker search methods
  async searchWorkers(params: any) {
    return this.get('/worker-search', params);
  }

  async getWorkerByLocation(params: any) {
    return this.get('/worker-location-search', params);
  }

  // Address validation methods
  async validateAddress(params: any) {
    return this.get('/address-validation', params);
  }

  async validatePostcode(postcode: string) {
    return this.get(`/postcode-validation/${postcode}`);
  }

  // Admin methods
  async getAdminData() {
    return this.get('/admin/dashboard');
  }

  async getAdminBookings(params?: any) {
    return this.get('/admin/bookings', params);
  }

  async getAdminPayments(params?: any) {
    return this.get('/admin/payments', params);
  }

  async getAdminServices(params?: any) {
    return this.get('/admin/services', params);
  }

  async getAdminUsers(params?: any) {
    return this.get('/admin/users', params);
  }

  // Account activation methods
  async getAccountActivationRequests(params?: any) {
    return this.get('/account-activation-requests', params);
  }

  async createAccountActivationRequest(data: any) {
    return this.post('/account-activation-requests', data);
  }


  async getWorkerStatus(workerId: string) {
    return this.get(`/worker-status/${workerId}`);
  }

  // Admin API methods

  async verifyWorker(workerId: string) {
    return this.post(`/admin/workers/${workerId}/verify`, {});
  }

  async rejectWorker(workerId: string, reason: string) {
    return this.post(`/admin/workers/${workerId}/reject`, { reason });
  }

  // Customer API methods
  async getCustomerData(customerId: string) {
    return this.get(`/customer-data/${customerId}`);
  }

  async bookService(serviceData: any) {
    return this.post('/customer/book-service', serviceData);
  }

  async addToFavorites(serviceId: string) {
    return this.post('/customer/add-favorite', { service_id: serviceId });
  }

  async removeFromFavorites(serviceId: string) {
    return this.delete(`/customer/remove-favorite/${serviceId}`);
  }

  async sendMessage(messageData: any) {
    return this.post('/customer/send-message', messageData);
  }

  async createCustomerReview(reviewData: any) {
    return this.post('/customer/create-review', reviewData);
  }

  async updateCustomerProfile(profileData: any) {
    return this.put('/customer/update-profile', profileData);
  }

  // Worker API methods
  async getWorkerData(workerId: string) {
    return this.get(`/worker-data/${workerId}`);
  }

  async getWorkerAnalytics(workerId: string) {
    return this.get(`/worker-analytics/${workerId}`);
  }

  async getWorkerEarnings(workerId: string) {
    return this.get(`/worker-earnings/${workerId}`);
  }


  async searchWorkersByLocation(searchParams: any) {
    return this.post('/worker-location-search', searchParams);
  }

  async getWorkerAvailability(workerId: string) {
    return this.get(`/worker-availability/${workerId}`);
  }

  async getWorkerAccountStatus(workerId: string) {
    return this.get(`/worker-account-status/${workerId}`);
  }

  async canWorkerPerformAction(workerId: string) {
    return this.get(`/worker-can-perform-action/${workerId}`);
  }

  async getWorkerUniqueCustomersCount(workerId: string) {
    return this.get(`/worker-unique-customers-count/${workerId}`);
  }

  async getWorkerCategoryInfo(workerId: string) {
    return this.get(`/worker-category-info/${workerId}`);
  }

  async checkWorkerDeactivationCriteria(workerId: string) {
    return this.get(`/worker-deactivation-criteria/${workerId}`);
  }

  async getWorkerPaymentSummary(params: any) {
    return this.get('/worker-payment-summary', params);
  }

  async getWeeklyEarnings(workerId: string) {
    return this.get(`/weekly-earnings/${workerId}`);
  }

  // Notification API methods

  async markNotificationAsRead(notificationId: string, data: any) {
    return this.put(`/notifications/${notificationId}`, data);
  }

  async markAllNotificationsAsRead(data: any) {
    return this.post('/notifications/mark-all-read', data);
  }

  async createNotification(data: any) {
    return this.post('/notifications', data);
  }

  async getUnreadCount(params: any) {
    return this.get('/notifications/unread-count', params);
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
