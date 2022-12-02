import axios from "../axiosConfig";

class Routes {
  getUsers(id) {
    return axios.get(`/user/get-users/${id}`);
  }

  getConversations(user_id) {
    return axios.get(`/user/get-conversations/${user_id}`);
  }

  getConversationById(id) {
    return axios.get(`/user/get-conversation/${id}`);
  }

  getConversation(data) {
    return axios.get(
      `/user/get-conversation/${data?.senderId}/${data?.receiverId}/?type=${data?.type}`
    );
  }

  getGroupConversation(id) {
    return axios.get(`/user/get-group-conversation/${id}`);
  }

  groupConversation(data) {
    return axios.post("/user/group-conversation", data);
  }

  addMessage(data) {
    return axios.post(`/user/add-message`, data);
  }
}

export default new Routes();
