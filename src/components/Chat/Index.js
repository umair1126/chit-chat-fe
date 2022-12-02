import React from "react";
import { Tabs, Form, message } from "antd";
import "./Index.css";
import { Avatar, List, Modal, Input, Select, Button } from "antd";
import { MoreOutlined, SendOutlined, PlusOutlined } from "@ant-design/icons";
import { UserAPI } from "../../api";
import MsgImg from "../../assets/images/message.png";
import ReactTimeAgo from "react-time-ago";
import { io } from "socket.io-client";

const { Option } = Select;

const Index = () => {
  const [form] = Form.useForm();
  const [allUsers, setAllUsers] = React.useState([]);
  const [allConversations, setAllConversations] = React.useState([]);
  const [allGroups, setAllGroups] = React.useState([]);
  const [currentChat, setCurrentChat] = React.useState(null);
  const [activeChat, setActiveChat] = React.useState();
  const [messages, setMessages] = React.useState([]);
  const [text, setText] = React.useState("");
  const [online, setOnline] = React.useState([]);
  const [arrivalMsg, setArrivalMsg] = React.useState(null);
  const [isModalOpen, setModalOpen] = React.useState(false);
  // const [cid, setCid] = React.useState();
  // const [socket, setSocket] = React.useState(null);
  const socket = React.useRef();
  let id = JSON.parse(localStorage.getItem("user"))?._id;

  const getAllConversations = (id) => {
    UserAPI.getConversations(id).then((res) => {
      // console.log(res);

      setAllConversations(
        res?.data?.data?.filter((item) => item?.conversationType == "single")
      );
      setAllGroups(
        res?.data?.data?.filter((item) => item?.conversationType == "group")
      );
    });
  };

  React.useEffect(() => {
    // socket.current = io("ws://13.231.192.73:4003");
    socket.current = io("ws://localhost:4003");
    socket.current.on("getMessage", (data) => {
      if (data) {
        setArrivalMsg({
          text: data?.text,
          senderId: data?.senderId,
          created_at: Date.now(),
          c_id: data?.c_id,
        });
      }
    });
    socket.current.on("getGroupMessage", (data) => {
      if (data) {
        setArrivalMsg({
          text: data?.text,
          senderId: data?.senderId,
          created_at: Date.now(),
          c_id: data?.c_id,
        });
      }
    });
  }, []);

  React.useEffect(() => {
    console.log(currentChat);
  }, [currentChat]);

  React.useEffect(() => {
    console.log(arrivalMsg, currentChat);
    id = JSON.parse(localStorage.getItem("user"))?._id;
    getAllConversations(id);

    // debugger;
    if (
      arrivalMsg &&
      currentChat?.conversationType == "single" &&
      currentChat._id == arrivalMsg.c_id &&
      currentChat?.members?.filter((elem) => elem?._id == arrivalMsg?.senderId)
        .length > 0
    ) {
      debugger;

      setMessages((messages) => [arrivalMsg, ...messages]);
      // alert(JSON.stringify(arrivalMsg.text));
      // getGroupConversation(id);
    } else if (
      arrivalMsg &&
      currentChat?.conversationType == "group" &&
      currentChat?._id == arrivalMsg?.c_id &&
      id !== arrivalMsg?.senderId
    ) {
      debugger;
      let name = currentChat?.members?.filter(
        (elem) => elem?._id == arrivalMsg?.senderId
      )[0]?.name;
      // console.log(arrivalMsg);
      let newMsg = [{ ...arrivalMsg, name: name }, ...messages];
      // console.log(newMsg, "msgs");
      setMessages((messages) => [
        { ...arrivalMsg, senderId: { name: name } },
        ...messages,
      ]);
    } else if (
      arrivalMsg &&
      arrivalMsg.senderId == activeChat?._id &&
      currentChat == ""
    ) {
      debugger;

      console.log(arrivalMsg);
      UserAPI.getConversationById(arrivalMsg?.c_id).then((res) => {
        // console.log(res?.data);
        setCurrentChat(res?.data?.conversation);
      });
      // console.log(arrivalMsg, "ArrivalMsg");
      setMessages((messages) => [arrivalMsg, ...messages]);
    }
  }, [arrivalMsg]);

  React.useEffect(() => {
    socket.current.emit("addUser", id);
    socket.current.on("getUsers", (users) => {
      // console.log(users);
      setOnline(users);
    });
    getAllConversations(id);
    UserAPI.getUsers(id).then((res) => {
      // console.log(res);
      setAllUsers(res?.data?.users);
    });
  }, [id]);

  let pic = "https://joeschmoe.io/api/v1/random";

  const getConversation = (senderId, receiverId, type) => {
    debugger;
    console.log(currentChat, ".....");
    UserAPI.getConversation({ senderId, receiverId, type }).then((res) => {
      console.log(res);
      if (res?.data?.data?.conversation)
        setCurrentChat(res?.data?.data?.conversation);
      setMessages(res?.data?.data?.reverse());
    });
  };

  const getConversationById = (id) => {
    UserAPI.getConversationById(id).then((res) => {
      // console.log(res?.data?.data);
      setMessages(res?.data?.data?.reverse());
    });
  };

  const handleActiveChat = (val, elem) => {
    const item = allUsers.find((user) => user._id === val._id);
    console.log(elem, val, item);
    setActiveChat(item);
    setCurrentChat(elem);
    // setCid(elem?._id);
    // console.log(val);
    getConversationById(elem?._id);
  };

  const handleFirstTime = (elem) => {
    // console.log(elem);
    // debugger;
    setActiveChat(elem);
    setCurrentChat("");
    getConversation(id, elem._id, "single");
    // const item = allUsers.find((user) => user._id === elem._id);
  };

  const handleGroupChat = (val) => {
    // console.log(val);
    setCurrentChat(val);
    setActiveChat({ name: val?.groupName, _id: val?._id });
    UserAPI.getGroupConversation(val?._id).then((res) => {
      setMessages(res?.data?.data.reverse());
      // console.log(res?.data?.data);
    });
  };

  const getGroupConversation = (id) => {
    UserAPI.getGroupConversation(id).then((res) => {
      setMessages(res?.data?.data?.reverse());
    });
  };

  const sendMessage = (_id) => {
    // debugger;
    if (currentChat?.conversationType == "single") {
      UserAPI.addMessage({
        conversationId: currentChat?._id || "",
        senderId: id,
        receiverId: _id,
        text: text,
      }).then((res) => {
        // console.log(res);
        if (res?.status == 201) {
          socket.current.emit("sendMessage", {
            senderId: id,
            receiverId: _id,
            text: text,
            c_id: currentChat?._id,
          });
          // console.log(messages, "oldone");
          // console.log(res?.data?.Data, "new message");
          getAllConversations(id);
          const newMsg = {
            ...res?.data?.Data,
            senderId: { _id: res?.data?.Data?.senderId },
          };
          setMessages([newMsg, ...messages]);
          // getConversation(id, _id);
          setText("");
        }
      });
    } else if (currentChat?.conversationType == "group") {
      // console.log(active);

      UserAPI.addMessage({
        conversationId: currentChat?._id,
        senderId: id,
        text: text,
      }).then((res) => {
        console.log(res);
        if (res?.status == 201) {
          socket.current.emit("sendGroupMessage", {
            senderId: id,
            text: text,
            c_id: currentChat?._id,
          });
          getAllConversations(id);
          const newMsg = {
            ...res?.data?.Data,
            senderId: { _id: res?.data?.Data?.senderId },
          };
          setMessages([newMsg, ...messages]);
          // getGroupConversation(currentChat?._id);
          setText("");
        }
      });
    } else {
      UserAPI.addMessage({
        senderId: id,
        receiverId: _id,
        text: text,
      }).then((res) => {
        console.log(res);
        if (res?.status == 201) {
          // console.log(res?.data?.Data);
          socket.current.emit("sendMessage", {
            senderId: id,
            receiverId: _id,
            text: text,
            c_id: res?.data?.Data?.conversationID,
          });
          getAllConversations(id);
          const newMsg = {
            ...res?.data?.Data,
            senderId: { _id: res?.data?.Data?.senderId },
          };
          setMessages([newMsg, ...messages]);
          setText("");
        }
      });
    }
  };

  const handleCancel = () => {
    setModalOpen(false);
  };

  const onFinish = (values) => {
    values.members.push(id);
    alert(JSON.stringify(values));
    UserAPI.groupConversation(values).then((res) => {
      if (res?.status == 201) {
        getAllConversations(id);
        setModalOpen(false);
        form.resetFields();
      }
    });
  };

  return (
    <>
      <Modal
        title="Make Group"
        open={isModalOpen}
        onCancel={handleCancel}
        maskClosable={false}
        cancelButtonProps={{ style: { display: "none" } }}
        okButtonProps={{ style: { display: "none" } }}
      >
        <Form form={form} onFinish={onFinish}>
          <Form.Item
            name="groupName"
            label="Group Name"
            rules={[
              {
                required: true,
                message: "required",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="members"
            label="Group Members"
            rules={[
              {
                required: true,
                message: "required",
              },
            ]}
          >
            <Select placeholder="Select members" allowClear mode="multiple">
              {allUsers?.map((item) => (
                <Option value={item?._id}>{item?.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <div className="chat-container">
        <div className="chat-section-1">
          <Tabs defaultActiveKey="1">
            <Tabs.TabPane tab="Chat" key="1">
              {allConversations?.length > 0 ? (
                <List
                  itemLayout="horizontal"
                  dataSource={allConversations}
                  renderItem={(item) => (
                    <List.Item>
                      {item?.members?.map((val) =>
                        val?._id == id ? null : (
                          <List.Item.Meta
                            avatar={<Avatar src={pic} size="large" />}
                            title={val?.name}
                            description={item?.lastMessage}
                            style={{ cursor: "pointer" }}
                            onClick={() => handleActiveChat(val, item)}
                          />
                        )
                      )}
                    </List.Item>
                  )}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <div>No any Conversation</div>
                </div>
              )}
            </Tabs.TabPane>
            <Tabs.TabPane tab="Support Chat" key="2">
              <div style={{ display: "flex", flexDirection: "column" }}>
                <List
                  itemLayout="horizontal"
                  dataSource={allGroups}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar src={pic} size="large" />}
                        title={item?.groupName}
                        description={item?.lastMessage}
                        style={{ cursor: "pointer" }}
                        onClick={() => handleGroupChat(item)}
                      />
                    </List.Item>
                  )}
                />
                <PlusOutlined
                  style={{
                    fontSize: "25px",
                    width: "30px",
                    margin: "auto",
                    borderRadius: "20px",
                    color: "white",
                    backgroundColor: "#7f7fe6",
                    padding: "5px 3px",
                    boxShadow: "rgb(0 0 0 / 24%) 0px 3px 8px",
                    cursor: "pointer",
                  }}
                  onClick={() => setModalOpen(true)}
                />
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Contacts" key="3">
              <List
                itemLayout="horizontal"
                dataSource={allUsers}
                renderItem={(item) => (
                  <List.Item
                    style={{ justifyContent: "flex-start", cursor: "pointer" }}
                    onClick={() => handleFirstTime(item)}
                  >
                    <Avatar src={"https://joeschmoe.io/api/v1/random"} />
                    <div style={{ marginLeft: "8px" }}>{item?.name}</div>
                  </List.Item>
                )}
              />
            </Tabs.TabPane>
          </Tabs>
        </div>
        <div className="chat-section-2">
          <div className="message-section">
            {activeChat ? (
              <>
                <div className="message-header">
                  <div className="header-wrap">
                    <span className="hedaer-name">{activeChat?.name}</span>
                    <span className="header-status">
                      {online?.map((user) =>
                        user?.userId == activeChat?._id ? "Active now" : ""
                      )}
                    </span>
                  </div>
                  <MoreOutlined
                    style={{ fontSize: "22px", cursor: "pointer" }}
                  />
                </div>
                {messages.length > 0 ? (
                  <div className="chat-messages">
                    {messages?.map((item) => {
                      debugger;
                      return (
                        <span
                          className={`chat-${
                            item?.senderId?._id == id ? "sender" : "receiver"
                          }`}
                        >
                          {currentChat?.conversationType == "group" &&
                          item?.senderId?._id !== id ? (
                            <div>{item?.senderId?.name}</div>
                          ) : null}
                          <div
                            className={`chat-text-${
                              item?.senderId?._id == id ? "sender" : "receiver"
                            }`}
                          >
                            {item?.text}
                          </div>
                          <div
                            className={`chat-text-time-${
                              item?.senderId?._id == id ? "sender" : "receiver"
                            }`}
                          >
                            <ReactTimeAgo
                              date={item?.created_at}
                              locale="en-US"
                            />
                          </div>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <div className="chat-messages">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                        color: "gray",
                      }}
                    >
                      <div>Type Message To Start the Conversation</div>
                    </div>
                  </div>
                )}
                <div className="send-message-input">
                  <input
                    type="text"
                    className="chat-sendMsg"
                    placeholder="Type Message"
                    value={text}
                    onKeyPress={(e) => {
                      if (e.key == "Enter" && text !== "")
                        sendMessage(activeChat?._id);
                    }}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <SendOutlined
                    className="sendIcon"
                    onClick={() => sendMessage(activeChat?._id)}
                  />
                </div>
              </>
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  flexDirection: "column",
                  padding: "10px",
                }}
              >
                <img src={MsgImg} alt="message" />
                <div style={{ color: "gray", fontSize: "20px" }}>
                  Open conversation to start the chat
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Index;
