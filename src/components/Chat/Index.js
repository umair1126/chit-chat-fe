import React from "react";
import { Tabs, Form, message } from "antd";
import "./Index.css";
import {
  Avatar,
  List,
  Modal,
  Input,
  Select,
  Button,
  Badge,
  Space,
  Dropdown,
  Divider,
  Upload,
  Spin,
  Image,
} from "antd";

import {
  MoreOutlined,
  SendOutlined,
  PlusOutlined,
  SmileTwoTone,
  CloseOutlined,
  FileOutlined,
} from "@ant-design/icons";
import { UserAPI } from "../../api";
import MsgImg from "../../assets/images/message.png";
import ReactTimeAgo from "react-time-ago";
import { io } from "socket.io-client";
import Picker from "emoji-picker-react";
import Swal from "sweetalert2";
import { RiAttachment2 } from "react-icons/ri";
import { MdDownload } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";

const { Option } = Select;

const Index = () => {
  const [form] = Form.useForm();
  const [allUsers, setAllUsers] = React.useState([]);
  const [dup_users, setDuplicateUsers] = React.useState([]);
  const [allConversations, setAllConversations] = React.useState([]);
  const [dup_conversation, setDup_Conversation] = React.useState([]);
  const [allGroups, setAllGroups] = React.useState([]);
  const [dup_groups, setDup_groups] = React.useState([]);
  const [currentChat, setCurrentChat] = React.useState(null);
  const [activeChat, setActiveChat] = React.useState();
  const [messages, setMessages] = React.useState([]);
  const [text, setText] = React.useState("");
  const [online, setOnline] = React.useState([]);
  const [arrivalMsg, setArrivalMsg] = React.useState(null);
  const [isModalOpen, setModalOpen] = React.useState(false);
  const [isModalOpen2, setModalOpen2] = React.useState(false);
  // const [activeUser, setActiveUser] = React.useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  // const [dropdownActive, setDropdownActive] = React.useState("none");
  const [listener, setListener] = React.useState(null);
  const [searchValue, setSearchValue] = React.useState(null);
  const [file, setFile] = React.useState(null);
  const [fileType, setFileType] = React.useState(null);
  const [spinner, setSpinner] = React.useState(false);
  const navigate = useNavigate();
  // const [cid, setCid] = React.useState();
  // const [socket, setSocket] = React.useState(null);
  const socket = React.useRef();
  let id = JSON.parse(localStorage.getItem("user"))?._id;

  const getAllConversations = (_id) => {
    UserAPI.getConversations(_id).then((res) => {
      setAllConversations(
        res?.data?.data?.filter((item) => item?.conversationType == "single")
      );
      setDup_Conversation(
        res?.data?.data?.filter((item) => item?.conversationType == "single")
      );
      setAllGroups(
        res?.data?.data?.filter((item) => item?.conversationType == "group")
      );
      setDup_groups(
        res?.data?.data?.filter((item) => item?.conversationType == "group")
      );
    });
  };

  const handleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleSelectEmoji = (e, emoji) => {
    console.log(emoji);
    let t = text;
    t += emoji.emoji;
    setText(t);
  };

  React.useEffect(() => {
    socket.current = io(
      "wss://chit-chat-be-production-a46e.up.railway.app:4003",
      {
        withCredentials: true,
        extraHeaders: {
          "my-custom-header": "abcd",
        },
      }
    );

    // socket.current = io("ws://13.231.192.73:4003");
    // socket.current = io.connect("ws://localhost:4003", {
    //   withCredentials: true,
    //   extraHeaders: {
    //     "my-custom-header": "abcd",
    //   },
    // });
    socket?.current?.on("getMessage", (data) => {
      if (data) {
        setArrivalMsg({
          text: data?.text,
          senderId: data?.senderId,
          created_at: Date.now(),
          c_id: data?.c_id,
          left: false,
          link: data?.link ? data?.link : null,
          msgType: data?.msgType,
        });
      }
    });
    socket?.current?.on("getGroupMessage", (data) => {
      if (data) {
        setArrivalMsg({
          text: data?.text,
          senderId: data?.senderId,
          created_at: Date.now(),
          c_id: data?.c_id,
          left: false,
          link: data?.link ? data?.link : null,
          msgType: data?.msgType,
        });
      }
    });
    socket?.current?.on("listenDeleteGroup", (data) => {
      setListener(data);
    });

    socket?.current?.on("listenLeaveGroup", (data) => {
      if (data) {
        setArrivalMsg({
          senderId: data?.senderId,
          c_id: data?.c_id,
          left: true,
        });
      }
    });
  }, []);

  React.useEffect(() => {
    console.log(currentChat, listener);
    if (currentChat?._id == listener?.c_id) {
      setCurrentChat(null);
      setActiveChat("");
      getAllConversations(id);
    } else {
      getAllConversations(id);
    }
  }, [listener]);

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
      let sender = allUsers?.find((user) => user?._id == arrivalMsg?.senderId);
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
    console.log(activeChat, "activeChat outside");
    debugger;
    socket.current.emit("addUser", id);
    socket?.current?.on("getUsers", (users) => {
      console.log(users, "activeUsers");
      console.log(activeChat, "activeChat inside");
      // let u = users?.find((user) => user?.userId == activeChat?._id);
      console.log(users, "users");
      setOnline(users);
    });
    getAllConversations(id);
    UserAPI.getUsers(id).then((res) => {
      // console.log(res);
      setAllUsers(res?.data?.users);
      setDuplicateUsers(res?.data?.users);
    });
  }, [id]);

  let pic = "https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png";

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
    console.log(val);
    setCurrentChat(val);
    setActiveChat({ name: val?.groupName, _id: val?._id });
    UserAPI.getGroupConversation(val?._id).then((res) => {
      setMessages(res?.data?.data.reverse());
      console.log(res?.data?.data);
    });
  };

  const sendMessage = async (_id) => {
    setSpinner(true);
    console.log(file);
    if (file == null) {
      if (currentChat?.conversationType == "single") {
        UserAPI.addMessage({
          conversationId: currentChat?._id || "",
          senderId: id,
          receiverId: _id,
          text: text,
          left: false,
        }).then((res) => {
          // console.log(res);
          setSpinner(false);
          if (res?.status == 201) {
            socket?.current?.emit("sendMessage", {
              senderId: id,
              receiverId: _id,
              text: text,
              c_id: currentChat?._id,
              link: null,
              msgType: "text",
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
          left: false,
        }).then((res) => {
          setSpinner(false);

          // console.log(res);
          if (res?.status == 201) {
            socket?.current?.emit("sendGroupMessage", {
              senderId: id,
              text: text,
              c_id: currentChat?._id,
              link: null,
              msgType: "text",
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
          left: false,
        }).then((res) => {
          console.log(res);
          setSpinner(false);
          if (res?.status == 201) {
            // console.log(res?.data?.Data);
            socket?.current?.emit("sendMessage", {
              senderId: id,
              receiverId: _id,
              text: text,
              c_id: res?.data?.Data?.conversationID,
              link: null,
              msgType: "text",
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
    } else {
      let formData = new FormData();
      if (currentChat?.conversationType == "single") {
        formData.append("conversationId", currentChat._id);
        formData.append("senderId", id);
        formData.append("receiverId", _id);
        formData.append("text", text);
        formData.append("left", false);
        formData.append("link", file);
        fileType == "file"
          ? formData.append("msgType", "file")
          : formData.append("msgType", "image");

        UserAPI.addMessage(formData).then((res) => {
          // console.log(res);

          setSpinner(false);
          if (res?.status == 201) {
            debugger;
            setFile(null);
            setFileType(null);
            socket?.current?.emit("sendMessage", {
              senderId: id,
              receiverId: _id,
              text: text,
              c_id: currentChat?._id,
              link: res?.data?.Data?.link,
              msgType: res?.data?.Data?.msgType,
            });
            // console.log(messages, "oldone");
            // console.log(res?.data?.Data, "new message");
            getAllConversations(id);
            const newMsg = {
              ...res?.data?.Data,
              senderId: { _id: res?.data?.Data?.senderId },
            };
            let arr = [newMsg, ...messages];
            console.log(arr);
            setMessages([newMsg, ...messages]);
            // getConversation(id, _id);
            setText("");
          }
        });
      } else if (currentChat?.conversationType == "group") {
        // console.log(active);
        formData.append("conversationId", currentChat._id);
        formData.append("senderId", id);
        formData.append("text", text);
        formData.append("left", false);
        formData.append("link", file);
        fileType == "file"
          ? formData.append("msgType", "file")
          : formData.append("msgType", "image");

        UserAPI.addMessage(formData).then((res) => {
          console.log(res);
          setSpinner(false);
          if (res?.status == 201) {
            setFileType(null);
            setFile(null);
            socket?.current?.emit("sendGroupMessage", {
              senderId: id,
              text: text,
              c_id: currentChat?._id,
              link: res?.data?.Data?.link,
              msgType: res?.data?.Data?.msgType,
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
        formData.append("senderId", id);
        formData.append("receiverId", _id);
        formData.append("text", text);
        formData.append("left", false);
        formData.append("link", file);
        fileType == "file"
          ? formData.append("msgType", "file")
          : formData.append("msgType", "image");
        UserAPI.addMessage(formData).then((res) => {
          console.log(res);
          setSpinner(false);
          if (res?.status == 201) {
            setFileType(null);
            setFile(null);
            // console.log(res?.data?.Data);
            socket?.current?.emit("sendMessage", {
              senderId: id,
              receiverId: _id,
              text: text,
              c_id: res?.data?.Data?.conversationID,
              link: res?.data?.Data?.link,
              msgType: res?.data?.Data?.msgType,
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
    }
  };

  const handleCancel = () => {
    setModalOpen(false);
  };

  const handleCancel2 = () => {
    setModalOpen2(false);
  };

  const onFinish = (values) => {
    values.members.push(id);
    // alert(JSON.stringify(values));
    UserAPI.groupConversation({ ...values, creator: id }).then((res) => {
      if (res?.status == 201) {
        getAllConversations(id);
        setModalOpen(false);
        form.resetFields();
      }
    });
  };

  const onLeaveGroup = (chat_id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, leave it!",
    }).then((result) => {
      if (result?.isConfirmed)
        UserAPI.onLeaveGroup(chat_id, id).then(async (res) => {
          if (res?.status == 200) {
            setCurrentChat(null);
            setActiveChat("");
            await getAllConversations(id);

            UserAPI.addMessage({
              conversationId: chat_id,
              senderId: id,
              text: null,
              left: true,
            }).then((res) => {
              if (res?.status == 201) {
                socket.current.emit("leaveGroup", {
                  senderId: id,
                  c_id: chat_id,
                });
              }
            });
          }
        });
    });
  };

  const onDeleteGroup = (chat_id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result?.isConfirmed)
        UserAPI.deleteGroup(chat_id).then(async (res) => {
          if (res?.status == 200) {
            setCurrentChat(null);
            setActiveChat("");
            await getAllConversations(id);
            socket.current.emit("deleteGroup", {
              c_id: chat_id,
            });
          }
        });
    });
  };

  const handleUpload = (event) => {
    setFile(event.file.originFileObj);
    setText(event?.file?.originFileObj?.name);
    console.log(event.file.originFileObj, "...");
    if (event.file.originFileObj.type.includes("image")) {
      console.log("image hai");
      setFileType("image");
    } else {
      console.log("file hai");
      setFileType("file");
    }
  };

  return (
    <div className="real-time-chat">
      <Modal
        title="Group Members"
        open={isModalOpen2}
        onCancel={handleCancel2}
        maskClosable={false}
        cancelButtonProps={{ style: { display: "none" } }}
        okButtonProps={{ style: { display: "none" } }}
      >
        <List
          itemLayout="horizontal"
          dataSource={currentChat?.members}
          renderItem={(item) => (
            <List.Item style={{ justifyContent: "flex-start" }}>
              <Avatar src={"https://joeschmoe.io/api/v1/random"} />
              <div style={{ marginLeft: "18px" }}>
                {item?._id == id ? "You" : item?.name}
              </div>
            </List.Item>
          )}
        />
      </Modal>
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
              <Input
                placeholder="Search Name"
                style={{ height: "35px" }}
                size="small"
                value={searchValue}
                onChange={(e) => {
                  const currValue = e.target.value;
                  setSearchValue(currValue);
                  // console.log(dup_conversation);

                  let arr = [];
                  for (let i = 0; i < dup_conversation.length; i++) {
                    let name = dup_conversation[i]?.members.find(
                      (elem) => elem?._id !== id
                    ).name;
                    if (
                      name?.toLowerCase().includes(currValue.toLowerCase()) ==
                      true
                    ) {
                      arr.push(dup_conversation[i]);
                    }
                  }

                  // console.log(arr);

                  setAllConversations(arr);
                }}
              />
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
                <Input
                  placeholder="Search Name"
                  style={{ height: "35px" }}
                  size="small"
                  value={searchValue}
                  onChange={(e) => {
                    const currValue = e.target.value;
                    setSearchValue(currValue);
                    let filteredData = dup_groups?.filter((entry) => {
                      return entry?.groupName.toLowerCase().includes(currValue);
                    });
                    setAllGroups(filteredData);
                  }}
                />
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
              <Input
                placeholder="Search Name"
                style={{ height: "35px" }}
                size="small"
                value={searchValue}
                onChange={(e) => {
                  const currValue = e.target.value;
                  setSearchValue(currValue);
                  let filteredData = dup_users?.filter((entry) => {
                    return entry?.name.toLowerCase().includes(currValue);
                  });
                  setAllUsers(filteredData);
                }}
              />
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
                      {online?.map((user) => {
                        if (user?.userId == activeChat?._id) {
                          console.log(activeChat);
                          return user?.userId !== activeChat?._id ? (
                            <ReactTimeAgo
                              date={activeChat?.lastActive}
                              locale="en-US"
                            />
                          ) : (
                            <Space direction="vertical">
                              <Badge status="success" text="Active now" />
                            </Space>
                          );
                        }
                      })}
                    </span>
                  </div>
                  {currentChat?.conversationType == "group" ? (
                    <div style={{ position: "relative" }}>
                      <Dropdown
                        dropdownRender={(menu) => (
                          <div className="dropdown-content">
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                padding: "5px",
                                backgroundColor: "white",
                                boxShadow: "0 8px 6px -5px rgba(0, 0, 0, 0.4)",
                                borderRadius: "10px",
                                width: "100px",
                                rowGap: "5px",
                              }}
                            >
                              <span
                                className="dropdown-item"
                                onClick={() => setModalOpen2(true)}
                              >
                                Members
                              </span>
                              {currentChat?.groupCreator == id ? (
                                <span
                                  className="dropdown-item"
                                  onClick={() =>
                                    onDeleteGroup(currentChat?._id)
                                  }
                                >
                                  Delete Group
                                </span>
                              ) : (
                                <span
                                  className="dropdown-item"
                                  onClick={() => onLeaveGroup(currentChat?._id)}
                                >
                                  Leave Group
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      >
                        <a onClick={(e) => e.preventDefault()}>
                          <Space>
                            <MoreOutlined
                              style={{ fontSize: "22px", cursor: "pointer" }}
                            />
                          </Space>
                        </a>
                      </Dropdown>
                    </div>
                  ) : null}
                </div>
                {messages.length > 0 ? (
                  <div className="chat-messages">
                    {messages?.map((item) => {
                      return (
                        <>
                          {item?.left == false ? (
                            <span
                              className={`chat-${
                                item?.senderId?._id == id
                                  ? "sender"
                                  : "receiver"
                              }`}
                            >
                              {currentChat?.conversationType == "group" &&
                              item?.left == false &&
                              item?.senderId?._id !== id ? (
                                <div
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {item?.senderId?.name}
                                </div>
                              ) : null}
                              {item?.msgType == "image" ? (
                                <Image
                                  width={170}
                                  src={item?.link}
                                  style={{ borderRadius: "5px" }}
                                />
                              ) : (
                                <div
                                  className={`chat-text-${
                                    item?.senderId?._id == id
                                      ? "sender"
                                      : "receiver"
                                  }`}
                                >
                                  {item?.text}
                                </div>
                              )}

                              {item?.msgType == "file" ? (
                                <FileOutlined />
                              ) : null}
                              <div
                                className={`chat-text-time-${
                                  item?.senderId?._id == id
                                    ? "sender"
                                    : "receiver"
                                }`}
                              >
                                <div style={{ marginTop: "5px" }}>
                                  {item?.msgType == "file" ? (
                                    <a
                                      href={item?.link}
                                      style={{
                                        color: `${
                                          item?.senderId?._id == id
                                            ? "white"
                                            : "black"
                                        }`,
                                      }}
                                    >
                                      <MdDownload size={20} />
                                    </a>
                                  ) : null}
                                </div>
                                <ReactTimeAgo
                                  date={item?.created_at}
                                  locale="en-US"
                                />
                              </div>
                            </span>
                          ) : (
                            <div style={{ display: "flex !important" }}>
                              <div className="chat-text-left">
                                {item?.senderId?.name} has left the group
                              </div>
                            </div>
                          )}
                        </>
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
                  {showEmojiPicker ? (
                    <CloseOutlined
                      onClick={handleEmojiPicker}
                      style={{
                        fontSize: "20px",
                        marginLeft: "7px",
                        color: "rgb(190, 190, 190)",
                      }}
                    />
                  ) : (
                    <SmileTwoTone
                      onClick={handleEmojiPicker}
                      style={{
                        fontSize: "20px",
                        marginLeft: "7px",
                        color: "rgb(190, 190, 190)",
                      }}
                    />
                  )}
                  {showEmojiPicker && (
                    <Picker
                      className="emoji-picker"
                      onEmojiClick={handleSelectEmoji}
                    />
                  )}
                  <Upload onChange={handleUpload}>
                    <Link to="#">
                      <RiAttachment2
                        size={19}
                        style={{
                          marginTop: "0.3rem",
                        }}
                      />
                    </Link>
                  </Upload>
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
                  {spinner ? (
                    <Spin />
                  ) : (
                    <SendOutlined
                      disabled
                      className="sendIcon"
                      onClick={() => {
                        if (text !== "") sendMessage(activeChat?._id);
                      }}
                    />
                  )}
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
    </div>
  );
};

export default Index;
