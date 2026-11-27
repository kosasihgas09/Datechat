
import { auth, db, rtdb } from "./firebase.js";

import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  runTransaction,
  writeBatch,
  arrayUnion,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  ref,
  onValue,
  onDisconnect,
  update,
  serverTimestamp as rtdbServerTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ELEMEN HALAMAN
const authLoadingScreen = document.getElementById("authLoadingScreen");
const loginScreen = document.getElementById("loginScreen");
const homeScreen = document.getElementById("homeScreen");
const chatScreen = document.getElementById("chatScreen");

const loginForm = document.getElementById("loginForm");
const registerButton = document.getElementById("registerButton");
const forgotPasswordButton = document.getElementById("forgotPasswordButton");
const forgotPasswordScreen = document.getElementById("forgotPasswordScreen");
const resetPasswordForm = document.getElementById("resetPasswordForm");
const resetEmailInput = document.getElementById("resetEmail");
const resetPasswordMessage = document.getElementById("resetPasswordMessage");
const resetPasswordSubmit = document.getElementById("resetPasswordSubmit");
const backToLoginButton = document.getElementById("backToLogin");

const registerScreen = document.getElementById("registerScreen");
const registerForm = document.getElementById("registerForm");
const registerDisplayName = document.getElementById("registerDisplayName");
const registerUsername = document.getElementById("registerUsername");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");
const registerConfirmPassword = document.getElementById("registerConfirmPassword");
const registerMessage = document.getElementById("registerMessage");
const registerSubmitButton = document.getElementById("registerSubmitButton");
const backToLoginFromRegister = document.getElementById("backToLoginFromRegister");

let sedangProsesPendaftaran = false;
let akunDaftarSementara = null;
const chatForm = document.getElementById("chatForm");

const messages = document.getElementById("messages");
const messageSearchInput = document.getElementById("messageSearchInput");

const chatInput = document.getElementById("chatInput");
const pickerPanel = document.getElementById("pickerPanel");
const suggestionPanel = document.getElementById("suggestionPanel");
const emojiToggle = document.getElementById("emojiToggle");
const stickerToggle = document.getElementById("stickerToggle");
const mediaToggle = document.getElementById("mediaToggle");
const mediaPanel = document.getElementById("mediaPanel");
const replyPreview = document.getElementById("replyPreview");
const replyPreviewName = document.getElementById("replyPreviewName");
const replyPreviewText = document.getElementById("replyPreviewText");
const cancelReply = document.getElementById("cancelReply");

// ELEMEN PROFIL
const openProfileButton = document.getElementById("openProfile");
const profilePanel = document.getElementById("profilePanel");
const settingsPanel = document.getElementById("settingsPanel");
const closeSettingsButton = document.getElementById("closeSettings");
const closeProfileButton = document.getElementById("closeProfile");
const profileAvatar = document.getElementById("profileAvatar");
const profileNameInput = document.getElementById("profileNameInput");
const profileUsernameInput = document.getElementById("profileUsernameInput");
const chooseProfilePhotoButton = document.getElementById("chooseProfilePhoto");
const takeProfilePhotoButton = document.getElementById("takeProfilePhoto");
const profilePhotoInput = document.getElementById("profilePhotoInput");
const profileCameraInput = document.getElementById("profileCameraInput");
const profileStatus = document.getElementById("profileStatus");
const saveProfileButton = document.getElementById("saveProfileButton");
const removeProfilePhotoButton = document.getElementById("removeProfilePhoto");

let selectedReply = null;
let removeProfilePhotoRequested = false;

const emojiList = [
  "😀", "😂", "🥰", "😍", "😘", "😭",
  "🤣", "😎", "🤗", "😡", "❤️", "🔥",
  "👍", "🙏", "👏", "💯", "🥳", "🤔"
];

const stickerEmojis = [
  "🥰", "😍", "😘", "😂", "🤣", "😭",
  "😎", "🤗", "❤️", "🔥", "👍", "🙏",
  "🥳", "💯", "😴", "🤔"
];

const stickerSuggestions = [
  { words: ["love", "cinta", "sayang"], emoji: "🥰" },
  { words: ["haha", "wkwk", "lucu"], emoji: "😂" },
  { words: ["semangat"], emoji: "🔥" },
  { words: ["good night", "selamat tidur"], emoji: "😴" },
  { words: ["makasih", "terima kasih"], emoji: "🙏" },
  { words: ["maaf", "sorry"], emoji: "🥺" },
  { words: ["halo", "hai"], emoji: "👋" },
  { words: ["kangen", "rindu"], emoji: "😘" }
];
const message = document.getElementById("message");

const email = document.getElementById("email");
const password = document.getElementById("password");
const usernameLoginInput = document.getElementById("usernameLogin");
const switchLoginModeButton = document.getElementById("switchLoginMode");

let loginMode = "username";
const searchInput = document.getElementById("searchConversation");

let currentUser = null;
let currentRoomId = null;

let selectedMessage = null;
const messageActionToolbar = document.getElementById("messageActionToolbar");
const selectedMessageLabel = document.getElementById("selectedMessageLabel");
const cancelMessageSelection = document.getElementById("cancelMessageSelection");
const copySelectedMessage = document.getElementById("copySelectedMessage");
const forwardSelectedMessage = document.getElementById("forwardSelectedMessage");
const forwardMessagePanel = document.getElementById("forwardMessagePanel");
const forwardMessageTargets = document.getElementById("forwardMessageTargets");
const cancelForwardMessage = document.getElementById("cancelForwardMessage");

const editSelectedMessage = document.getElementById("editSelectedMessage");
const deleteSelectedMessage = document.getElementById("deleteSelectedMessage");

// PENERUSAN PESAN KE RUANG CHAT LAIN
function tutupPanelPenerusan() {
  if (forwardMessagePanel) forwardMessagePanel.hidden = true;
  if (forwardMessageTargets) forwardMessageTargets.replaceChildren();
}

if (cancelForwardMessage) {
  cancelForwardMessage.addEventListener("click", tutupPanelPenerusan);
}

if (forwardSelectedMessage) {
  forwardSelectedMessage.addEventListener("click", function() {
    if (!selectedMessage || !currentUser ||
        !forwardMessagePanel || !forwardMessageTargets) return;

    forwardMessageTargets.replaceChildren();

    const tujuan = roomsCache.filter(function(room) {
      return room.id !== selectedMessage.roomId &&
        Array.isArray(room.members) &&
        room.members.includes(currentUser.uid);
    });

    if (!tujuan.length) {
      const kosong = document.createElement("p");
      kosong.textContent = "Belum ada percakapan lain untuk tujuan penerusan.";
      forwardMessageTargets.appendChild(kosong);
    }

    tujuan.forEach(function(room) {
      const profil = partnerProfiles.get(room.id) || {};
      const nama = profil.displayName || profil.username || "Percakapan";

      const tombol = document.createElement("button");
      tombol.type = "button";
      tombol.className = "forward-message-target";
      tombol.textContent = nama;

      tombol.addEventListener("click", async function() {
        if (!selectedMessage || !currentUser) return;

        const pesanAsal = selectedMessage;
        const uidPengirim = currentUser.uid;
        tombol.disabled = true;
        tombol.textContent = "Mengirim...";

        try {
          const bolehKirim = await bolehMengirimKeRoom(room.id, uidPengirim);

          if (!bolehKirim) {
            throw new Error("Kamu tidak dapat mengirim ke percakapan ini.");
          }

          if (!currentUser || currentUser.uid !== uidPengirim) {
            throw new Error("Sesi akun berubah. Silakan coba lagi.");
          }

          const data = pesanAsal.data;
          const pesanBaru = {
            senderId: uidPengirim,
            text: typeof data.text === "string" ? data.text : "",
            createdAt: serverTimestamp(),
            deliveredTo: [],
            readBy: [],};

          ["mediaUrl", "mediaType", "mediaName"].forEach(function(kunci) {
            if (data[kunci] !== undefined) {
              pesanBaru[kunci] = data[kunci];
            }
          });

          if (!pesanBaru.text && !pesanBaru.mediaUrl) {
            throw new Error("Pesan ini tidak memiliki isi untuk diteruskan.");
          }

          await addDoc(
            collection(db, "rooms", room.id, "messages"),
            pesanBaru
          );

          tutupPanelPenerusan();
          batalPilihPesanAksi();
          alert("Pesan berhasil diteruskan ke " + nama + ".");
        } catch (error) {
          console.error("Gagal meneruskan pesan:", error);
          alert("Pesan gagal diteruskan: " + error.message);
          tombol.disabled = false;
          tombol.textContent = nama;
        }
      });

      forwardMessageTargets.appendChild(tombol);
    });

    forwardMessagePanel.hidden = false;
  });
}


// DATECHAT FORWARD SEARCH BY USERNAME
const forwardUsernameInput = document.getElementById("forwardUsernameInput");
const forwardUsernameSearch = document.getElementById("forwardUsernameSearch");
const forwardUsernameResult = document.getElementById("forwardUsernameResult");

if (forwardUsernameSearch && forwardUsernameInput && forwardUsernameResult) {
  async function cariPenggunaUntukForward() {
    const username = forwardUsernameInput.value.trim()
      .replace(/^@/, "").toLowerCase();

    forwardUsernameResult.replaceChildren();

    if (!selectedMessage || !currentUser) {
      forwardUsernameResult.textContent = "Pilih pesan yang ingin diteruskan terlebih dahulu.";
      return;
    }

    if (!/^[a-z0-9_]{4,20}$/.test(username)) {
      forwardUsernameResult.textContent =
        "Username harus 4-20 karakter, huruf kecil, angka, atau garis bawah.";
      return;
    }

    const tombolCari = forwardUsernameSearch;
    tombolCari.disabled = true;
    tombolCari.textContent = "Mencari...";

    try {
      const usernameSnap = await getDoc(doc(db, "usernames", username));

      if (!usernameSnap.exists()) {
        forwardUsernameResult.textContent = "Username tidak ditemukan.";
        return;
      }

      const pemilik = usernameSnap.data();
      const uidTeman = pemilik.uid;
      const uidSaya = currentUser.uid;

      if (!uidTeman || pemilik.username !== username || uidTeman === uidSaya) {
        forwardUsernameResult.textContent = "Data pengguna tidak valid.";
        return;
      }

      const profilSnap = await getDoc(doc(db, "publicProfiles", uidTeman));

      if (!profilSnap.exists()) {
        forwardUsernameResult.textContent = "Profil pengguna tidak ditemukan.";
        return;
      }

      const profil = profilSnap.data();

      if (profil.uid !== uidTeman || profil.username !== username) {
        forwardUsernameResult.textContent = "Data profil tidak cocok.";
        return;
      }

      const friendshipSnap = await getDocs(query(
        collection(db, "friendships"),
        where("members", "array-contains", uidSaya)
      ));

      const sudahTeman = friendshipSnap.docs.some(function(item) {
        const anggota = item.data().members;
        return Array.isArray(anggota) && anggota.includes(uidTeman);
      });

      if (!sudahTeman) {
        forwardUsernameResult.textContent =
          "Kamu belum berteman dengan @" + username +
          ". Tambahkan teman terlebih dahulu melalui menu Teman.";
        return;
      }

      const kartu = document.createElement("div");
      kartu.className = "forward-user-result-card";

      if (profil.photoURL) {
        const foto = document.createElement("img");
        foto.src = profil.photoURL;
        foto.alt = "Foto profil";
        foto.className = "friend-search-avatar";
        kartu.appendChild(foto);
      } else {
        const avatar = document.createElement("div");
        avatar.className = "forward-user-placeholder";
        avatar.textContent = (profil.displayName || username).charAt(0).toUpperCase();
        kartu.appendChild(avatar);
      }

      const info = document.createElement("div");
      info.className = "forward-user-info";

      const nama = document.createElement("strong");
      nama.textContent = profil.displayName || "Pengguna DateChat";

      const id = document.createElement("span");
      id.textContent = "@" + username;

      info.append(nama, id);

      const tombolKirim = document.createElement("button");
      tombolKirim.type = "button";
      tombolKirim.className = "forward-user-send";
      tombolKirim.textContent = "Teruskan";

      kartu.append(info, tombolKirim);
      forwardUsernameResult.appendChild(kartu);

      tombolKirim.addEventListener("click", async function() {
        if (!selectedMessage || !currentUser) return;

        const pesanAsal = selectedMessage;
        const uidPengirim = currentUser.uid;

        tombolKirim.disabled = true;
        tombolKirim.textContent = "Mengirim...";
        let tahapForward = "memeriksa pertemanan";

        try {
                    tahapForward = "memeriksa pertemanan";
          const friendshipTerbaru = await getDocs(query(
            collection(db, "friendships"),
            where("members", "array-contains", uidPengirim)
          ));

          const masihTeman = friendshipTerbaru.docs.some(function(item) {
            const anggota = item.data().members;
            return Array.isArray(anggota) && anggota.includes(uidTeman);
          });

          if (!masihTeman) {
            throw new Error("Pertemanan sudah tidak aktif.");
          }

          if (!currentUser || currentUser.uid !== uidPengirim) {
            throw new Error("Sesi akun berubah. Silakan coba lagi.");
          }

                    tahapForward = "memuat ruang chat";
          const ruangSnap = await getDocs(query(
            collection(db, "rooms"),
            where("members", "array-contains", uidPengirim)
          ));

          if (ruangSnap.docs.length > 498) {
            throw new Error("Terlalu banyak ruang chat untuk diproses.");
          }

          const ruangAda = ruangSnap.docs.find(function(item) {
            const dataRuang = item.data();
            const anggota = dataRuang.members;

            return dataRuang.type === "private"
              && Array.isArray(anggota)
              && anggota.length === 2
              && anggota.includes(uidPengirim)
              && anggota.includes(uidTeman);
          });

          let roomId;
          let dataRuang;

          if (ruangAda) {
            roomId = ruangAda.id;
                      tahapForward = "memperbarui ruang chat";
          await updateDoc(ruangAda.ref, {
              friendshipRequired: true
            });
            dataRuang = {
              id: roomId,
              ...ruangAda.data(),
              friendshipRequired: true
            };
          } else {
                      tahapForward = "membuat ruang chat";
          const ruangBaru = await addDoc(collection(db, "rooms"), {
              type: "private",
              members: [uidPengirim, uidTeman],
              createdBy: uidPengirim,
              createdAt: serverTimestamp(),
              friendshipRequired: true
            });

            roomId = ruangBaru.id;
            dataRuang = {
              id: roomId,
              type: "private",
              members: [uidPengirim, uidTeman],
              createdBy: uidPengirim,
              friendshipRequired: true
            };
          }

          if (!currentUser || currentUser.uid !== uidPengirim) {
            throw new Error("Sesi akun berubah. Silakan coba lagi.");
          }

                    tahapForward = "memeriksa izin ruang chat";
          const bolehKirim = await bolehMengirimKeRoom(roomId, uidPengirim);
          if (!bolehKirim) {
            throw new Error("Kamu tidak dapat mengirim ke percakapan ini.");
          }

          const data = pesanAsal.data;
          const pesanBaru = {
            senderId: uidPengirim,
            text: typeof data.text === "string" ? data.text : "",
            createdAt: serverTimestamp(),
            deliveredTo: [],
            readBy: []
          };
          ["mediaUrl", "mediaType", "mediaName"].forEach(function(kunci) {
            if (data[kunci] !== undefined) {
              pesanBaru[kunci] = data[kunci];
            }
          });

          if (!pesanBaru.text && !pesanBaru.mediaUrl) {
            throw new Error("Pesan ini tidak memiliki isi untuk diteruskan.");
          }

                    tahapForward = "menyimpan pesan ke ruang tujuan";
          await addDoc(
            collection(db, "rooms", roomId, "messages"),
            pesanBaru
          );

          const index = roomsCache.findIndex(function(room) {
            return room.id === roomId;
          });

          if (index === -1) {
            roomsCache.push(dataRuang);
          } else {
            roomsCache[index] = dataRuang;
          }

          updateLatestListeners();
          renderConversations();

          tutupPanelPenerusan();
          batalPilihPesanAksi();
          alert("Pesan berhasil diteruskan ke " +
            (profil.displayName || "@" + username) + ".");
        } catch (error) {
          console.error("Gagal meneruskan pesan ke pengguna:", {
            tahap: tahapForward,
            code: error.code,
            message: error.message,
            error: error
          });
          alert(
            "Gagal pada tahap: " + tahapForward +
            "\nKode: " + (error.code || "tidak tersedia") +
            "\nPesan: " + error.message
          );
          tombolKirim.disabled = false;
          tombolKirim.textContent = "Teruskan";
        }
      });

    } catch (error) {
      console.error("Pencarian Forward gagal:", error);
      forwardUsernameResult.textContent = "Gagal mencari pengguna. Coba lagi.";
    } finally {
      tombolCari.disabled = false;
      tombolCari.textContent = "Cari";
    }
  }

  forwardUsernameSearch.addEventListener("click", cariPenggunaUntukForward);

  forwardUsernameInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      cariPenggunaUntukForward();
    }
  });
}

function batalPilihPesanAksi() {
  if (selectedMessage && selectedMessage.bubble) {
    selectedMessage.bubble.classList.remove("message-selected");
  }

  selectedMessage = null;

  if (messageActionToolbar) {
    messageActionToolbar.classList.remove("is-deleting");
    messageActionToolbar.hidden = true;
  }

  if (deleteMessageChoices) {
    deleteMessageChoices.hidden = true;
  }

  if (selectedMessageLabel) {
    selectedMessageLabel.textContent = "Pesan dipilih";
  }
}

function pilihPesanAksi(roomId, messageId, data, bubble, milikSaya) {
  batalPilihPesanAksi();

  selectedMessage = {
    roomId: roomId,
    messageId: messageId,
    data: data,
    bubble: bubble,
    milikSaya: milikSaya
  };

  bubble.classList.add("message-selected");

  if (messageActionToolbar) {
    messageActionToolbar.hidden = false;
  }

  if (selectedMessageLabel) {
    selectedMessageLabel.textContent = "1 pesan dipilih";
  }

  if (editSelectedMessage) {
    editSelectedMessage.hidden = !(
      milikSaya && data.text && !data.mediaUrl
    );
  }

  if (copySelectedMessage) {
    copySelectedMessage.hidden = !data.text;
  }
}

if (cancelMessageSelection) {
  cancelMessageSelection.addEventListener(
    "click",
    batalPilihPesanAksi
  );
}

if (copySelectedMessage) {
  copySelectedMessage.addEventListener("click", async function() {
    if (!selectedMessage || !selectedMessage.data.text) return;

    const teks = selectedMessage.data.text;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(teks);
      } else {
        const area = document.createElement("textarea");
        area.value = teks;
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
      }

      batalPilihPesanAksi();
      alert("Pesan berhasil disalin.");
    } catch (error) {
      console.error("Gagal menyalin pesan:", error);
      alert("Pesan gagal disalin.");
    }
  });
}

if (editSelectedMessage) {
  editSelectedMessage.addEventListener("click", async function() {
    if (!selectedMessage || !selectedMessage.milikSaya) return;

    const pesan = selectedMessage;
    if (!pesan.data.text || pesan.data.mediaUrl) return;

    await editMessage(
      pesan.roomId,
      pesan.messageId,
      pesan.data.text
    );
  });
}




// PILIHAN DAN KEBIJAKAN HAPUS PESAN
const deleteMessageChoices = document.getElementById("deleteMessageChoices");
const deleteForEveryone = document.getElementById("deleteForEveryone");
const deleteForMe = document.getElementById("deleteForMe");
const cancelDeleteChoices = document.getElementById("cancelDeleteChoices");

function usiaPesanDalamMilidetik(data) {
  const waktu = data && data.createdAt;
  if (!waktu) return Infinity;
  const dibuat = typeof waktu.toMillis === "function"
    ? waktu.toMillis()
    : (waktu instanceof Date ? waktu.getTime() : NaN);
  return Number.isFinite(dibuat) ? Date.now() - dibuat : Infinity;
}

if (deleteSelectedMessage) {
  deleteSelectedMessage.addEventListener("click", function() {
    if (!selectedMessage) return;

    if (messageActionToolbar) {
      messageActionToolbar.classList.add("is-deleting");
    }
    if (selectedMessageLabel) {
      selectedMessageLabel.textContent = "Hapus pesan";
    }
    const usia = usiaPesanDalamMilidetik(selectedMessage.data);
    if (deleteForEveryone) {
      deleteForEveryone.hidden = !(
        selectedMessage.milikSaya && usia >= 0 && usia <= 60000
      );
    }
    if (deleteForMe) deleteForMe.hidden = false;
    if (deleteMessageChoices) deleteMessageChoices.hidden = false;
  });
}

if (cancelDeleteChoices) {
  cancelDeleteChoices.addEventListener("click", function() {
    if (deleteMessageChoices) deleteMessageChoices.hidden = true;

    if (messageActionToolbar) {
      messageActionToolbar.classList.remove("is-deleting");
    }
    if (selectedMessageLabel) {
      selectedMessageLabel.textContent = "1 pesan dipilih";
    }
  });
}

if (deleteForMe) {
  deleteForMe.addEventListener("click", async function() {
    if (!selectedMessage) return;
    const pesan = selectedMessage;
    if (deleteMessageChoices) deleteMessageChoices.hidden = true;
    await sembunyikanPesanUntukSaya(pesan.roomId, pesan.messageId, false);
    batalPilihPesanAksi();
  });
}

if (deleteForEveryone) {
  deleteForEveryone.addEventListener("click", async function() {
    if (!selectedMessage || !selectedMessage.milikSaya) return;
    const pesan = selectedMessage;
    const usia = usiaPesanDalamMilidetik(pesan.data);

    if (usia < 0 || usia > 60000) {
      alert("Batas waktu hapus untuk semua sudah lewat.");
      deleteForEveryone.hidden = true;
      return;
    }

    if (!confirm("Hapus pesan ini untuk semua orang?")) return;

    try {
      await deleteDoc(doc(db, "rooms", pesan.roomId, "messages", pesan.messageId));
      if (deleteMessageChoices) deleteMessageChoices.hidden = true;
      batalPilihPesanAksi();
    } catch (error) {
      console.error("Gagal menghapus pesan untuk semua:", error);
      alert("Pesan gagal dihapus: " + error.message);
    }
  });
}

// LISTENER STATUS ONLINE
let stopOwnPresenceConnection = null;
let stopPartnerPresence = null;
let currentFilter = "all";

let stopMessages = null;
let stopHiddenMessages = null;
let hiddenMessageIds = new Set();
let stopHiddenChats = null;
let hiddenChats = new Map();
let hiddenChatsLoaded = false;
let stopRooms = null;

let roomsCache = [];
let latestMessages = new Map();
let partnerProfiles = new Map();
let partnerProfileUnsubs = new Map();
let latestUnsubs = new Map();
let deliveryUnsubs = new Map();
let unreadCounts = new Map();

// MEMERIKSA STATUS PERTEMANAN SEBELUM MENGIRIM PESAN
async function bolehMengirimKeRoom(roomId, uidSaya) {
  const roomSnap = await getDoc(doc(db, "rooms", roomId));

  if (!roomSnap.exists()) {
    throw new Error("Ruang chat tidak ditemukan.");
  }

  const roomData = roomSnap.data();

  if (!Array.isArray(roomData.members) ||
      !roomData.members.includes(uidSaya)) {
    throw new Error("Kamu bukan anggota ruang chat ini.");
  }

  if (roomData.friendshipRequired !== true) {
    return true;
  }

  const friendUid = roomData.members.find(function(uid) {
    return uid !== uidSaya;
  });

  if (!friendUid) return true;

  const friendshipsSnap = await getDocs(query(
    collection(db, "friendships"),
    where("members", "array-contains", uidSaya)
  ));

  return friendshipsSnap.docs.some(function(snapshot) {
    const data = snapshot.data();

    return Array.isArray(data.members) &&
      data.members.includes(uidSaya) &&
      data.members.includes(friendUid);
  });
}



// DATA PROFIL
let currentProfile = {
  displayName: "",
  photoURL: "",
  username: ""
};

let currentPartnerProfile = {
  displayName: "",
  photoURL: "",
  username: ""
};
let selectedProfileFile = null;
let stopPartnerProfile = null;

// MENGELOLA STATUS ONLINE PENGGUNA
function hentikanListenerPresenceSendiri() {
  if (stopOwnPresenceConnection) {
    stopOwnPresenceConnection();
    stopOwnPresenceConnection = null;
  }
}

async function mulaiPresenceSendiri(user) {
  if (!user) return;

  hentikanListenerPresenceSendiri();

  const koneksiRef = ref(rtdb, ".info/connected");

  stopOwnPresenceConnection = onValue(
    koneksiRef,
    async function(snapshot) {
      if (snapshot.val() !== true) return;
      if (!currentUser || currentUser.uid !== user.uid) return;

      const presenceRef = ref(rtdb, "presence/" + user.uid);

      try {
        await onDisconnect(presenceRef).update({
          online: false,
          lastSeen: rtdbServerTimestamp()
        });

        await update(presenceRef, {
          online: true,
          privacy: {
            onlineVisibility: privacySettings.onlineVisibility,
            lastSeenVisibility: privacySettings.lastSeenVisibility
          }
        });
      } catch (error) {
        console.error("Gagal memperbarui status online:", error);
      }
    },
    function(error) {
      console.error("Gagal memantau koneksi Firebase:", error);
    }
  );
}

async function akhiriPresenceSendiri() {
  hentikanListenerPresenceSendiri();

  if (!currentUser) return;

  try {
    await update(ref(rtdb, "presence/" + currentUser.uid), {
      online: false,
      lastSeen: rtdbServerTimestamp()
    });
  } catch (error) {
    console.warn("Gagal memperbarui status offline:", error);
  }
}

async function sinkronkanPrivasiPresence() {
  if (!currentUser) return;

  try {
    await update(ref(rtdb, "presence/" + currentUser.uid), {
      privacy: {
        onlineVisibility: privacySettings.onlineVisibility,
        lastSeenVisibility: privacySettings.lastSeenVisibility
      }
    });
  } catch (error) {
    console.warn("Gagal menyinkronkan privasi presence:", error);
  }
}

let stopFriendRequests = null;
let stopFriendships = null;
let friendProfiles = [];
let searchTimer = null;
let searchRunId = 0;
let searchMessageMatches = new Map();

// CACHE PENCARIAN PESAN DI BERANDA
let homeMessageMatches = new Map();
let homeMessageSearchTerm = "";
let homeMessageSearchLoading = false;
let homeSearchRunId = 0;

async function cariPesanBeranda(kataKunci) {
  const runId = ++homeSearchRunId;
  homeMessageSearchTerm = kataKunci;
  homeMessageMatches.clear();

  if (!kataKunci) {
    homeMessageSearchLoading = false;
    renderConversations();
    return;
  }

  homeMessageSearchLoading = true;
  renderConversations();

  try {
    const hasil = await Promise.all(
      roomsCache.map(async function(room) {
        const [pesanSnapshot, hiddenSnapshot] = await Promise.all([
          getDocs(query(
            collection(db, "rooms", room.id, "messages"),
            orderBy("createdAt", "desc"),
            limit(100)
          )),
          getDocs(query(
            collection(db, "users", currentUser.uid, "hiddenMessages"),
            where("roomId", "==", room.id)
          ))
        ]);

        const pesanTersembunyi = new Set(
          hiddenSnapshot.docs.map(function(item) {
            return item.data().messageId;
          })
        );

        const statusChat = hiddenChats.get(room.id) || {};
        const waktuDisembunyikan = statusChat.hiddenAt;
        const batasWaktu = waktuDisembunyikan?.toMillis
          ? waktuDisembunyikan.toMillis()
          : 0;

        for (const item of pesanSnapshot.docs) {
          if (pesanTersembunyi.has(item.id)) continue;

          const data = item.data();
          const waktuPesan = data.createdAt?.toMillis?.() || 0;

          if (batasWaktu && waktuPesan <= batasWaktu) continue;

          const teks = typeof data.text === "string" ? data.text : "";
          if (teks.toLowerCase().includes(kataKunci)) {
            return {
              roomId: room.id,
              text: teks,
              createdAt: data.createdAt
            };
          }
        }

        return null;
      })
    );

    if (runId !== homeSearchRunId) return;

    hasil.forEach(function(item) {
      if (item) homeMessageMatches.set(item.roomId, item);
    });
  } catch (error) {
    console.error("Gagal mencari isi pesan:", error);
  }

  if (runId !== homeSearchRunId) return;

  homeMessageSearchLoading = false;
  renderConversations();
}



// CACHE DAN PENCARIAN PESAN
function terapkanPencarianPesan() {
  if (!messageSearchInput || !currentRoomId) return;

  const kataKunci = messageSearchInput.value.trim().toLowerCase();
  let cache = searchMessageMatches.get(currentRoomId);

  if (!cache || cache.term !== kataKunci) {
    const idsCocok = new Set();

    messages.querySelectorAll(".message-bubble[data-message-id]")
      .forEach(function(bubble) {
        const elemenTeks = bubble.querySelector(".message-text");
        const teks = elemenTeks ? elemenTeks.textContent.toLowerCase() : "";

        if (!kataKunci || teks.includes(kataKunci)) {
          idsCocok.add(bubble.dataset.messageId);
        }
      });

    cache = { term: kataKunci, ids: idsCocok };
    searchMessageMatches.set(currentRoomId, cache);
  }

  messages.querySelectorAll(".message-bubble[data-message-id]")
    .forEach(function(bubble) {
      bubble.hidden = Boolean(kataKunci) &&
        !cache.ids.has(bubble.dataset.messageId);
    });
}

// TAMPILKAN HALAMAN
function showScreen(screen) {
  authLoadingScreen.hidden = screen !== "loading";
  loginScreen.hidden = screen !== "login";
  homeScreen.hidden = screen !== "home";
  chatScreen.hidden = screen !== "chat";

  if (registerScreen) {
    registerScreen.hidden = screen !== "register";
  }

  if (forgotPasswordScreen) {
    forgotPasswordScreen.hidden = screen !== "forgotPassword";
  }
}

/* NAVIGASI BACK ANDROID UNTUK HALAMAN LOGIN */
let halamanAuthAktif = "login";

function bukaHalamanAuth(halaman) {
  halamanAuthAktif = halaman;
  showScreen(halaman);
  history.pushState({ datechatAuth: halaman }, "");
}

window.addEventListener("popstate", function() {
  if (
    halamanAuthAktif === "register" ||
    halamanAuthAktif === "forgotPassword"
  ) {
    halamanAuthAktif = "login";
    showScreen("login");
    return;
  }

  halamanAuthAktif = "login";
});


// FORMAT WAKTU
function formatTime(timestamp) {
  if (!timestamp || !timestamp.toDate) return "";

  return timestamp.toDate().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatConversationTime(timestamp) {
  if (!timestamp || !timestamp.toDate) return "";

  const tanggalPesan = timestamp.toDate();
  const sekarang = new Date();

  const hariIni = new Date(
    sekarang.getFullYear(),
    sekarang.getMonth(),
    sekarang.getDate()
  );

  const tanggalKemarin = new Date(hariIni);
  tanggalKemarin.setDate(tanggalKemarin.getDate() - 1);

  const tanggalPesanHari = new Date(
    tanggalPesan.getFullYear(),
    tanggalPesan.getMonth(),
    tanggalPesan.getDate()
  );

  if (tanggalPesanHari.getTime() === hariIni.getTime()) {
    return tanggalPesan.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  if (tanggalPesanHari.getTime() === tanggalKemarin.getTime()) {
    return "Kemarin";
  }

  const hari = String(tanggalPesan.getDate()).padStart(2, "0");
  const bulan = String(tanggalPesan.getMonth() + 1).padStart(2, "0");
  const tahun = String(tanggalPesan.getFullYear()).slice(-2);

  return hari + "." + bulan + "." + tahun;
}

// MODE LOGIN USERNAME / EMAIL
function setLoginMode(mode) {
  loginMode = mode;
  const gunakanEmail = mode === "email";

  usernameLoginInput.hidden = gunakanEmail;
  usernameLoginInput.required = !gunakanEmail;
  email.hidden = !gunakanEmail;
  email.required = gunakanEmail;

  switchLoginModeButton.textContent = gunakanEmail
    ? "Masuk dengan Username"
    : "Masuk dengan Email";

  message.textContent = "";
}

switchLoginModeButton.addEventListener("click", function() {
  setLoginMode(loginMode === "username" ? "email" : "username");
});

/* HALAMAN LUPA PASSWORD TERPISAH */
forgotPasswordButton.addEventListener("click", function() {
  resetEmailInput.value = loginMode === "email" ? email.value.trim() : "";
  bukaHalamanAuth("forgotPassword");
  resetPasswordMessage.textContent = "";
  resetPasswordSubmit.disabled = false;
  resetEmailInput.focus();
});

backToLoginButton.addEventListener("click", function() {
  showScreen("login");
  resetPasswordMessage.textContent = "";
  email.value = resetEmailInput.value.trim();
  setLoginMode("email");
  email.focus();
});

/* KIRIM EMAIL PEMULIHAN FIREBASE */
resetPasswordForm.addEventListener("submit", async function(event) {
  event.preventDefault();

  const alamatEmail = resetEmailInput.value.trim();

  if (!alamatEmail) {
    resetPasswordMessage.textContent = "Masukkan alamat email terlebih dahulu.";
    resetEmailInput.focus();
    return;
  }

  resetPasswordSubmit.disabled = true;
  resetPasswordMessage.textContent = "Sedang mengirim tautan pemulihan...";

  try {
    await sendPasswordResetEmail(auth, alamatEmail);
    resetPasswordMessage.textContent =
      "Tautan pemulihan telah diminta. Periksa inbox dan folder spam email kamu. Setelah mengganti password melalui tautan, kembali ke halaman login.";
  } catch (error) {
    console.error("Pemulihan password gagal:", error);

    if (error.code === "auth/invalid-email") {
      resetPasswordMessage.textContent = "Format alamat email tidak valid.";
    } else if (error.code === "auth/too-many-requests") {
      resetPasswordMessage.textContent = "Terlalu banyak percobaan. Coba lagi nanti.";
    } else {
      resetPasswordMessage.textContent =
        "Gagal mengirim tautan. Periksa koneksi dan konfigurasi Firebase.";
    }
  } finally {
    resetPasswordSubmit.disabled = false;
  }
});

const DATECHAT_AUTH_URL =
  "https://datechat-auth.sopojaro23.workers.dev";

// SINKRONISASI USERNAME KE CLOUDFLARE KV
async function sinkronkanUsernameKeWorker(user, username) {
  if (!user || !username) return;

  const idToken = await user.getIdToken();

  const response = await fetch(DATECHAT_AUTH_URL + "/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ idToken })
  });

  const hasil = await response.json();

  if (!response.ok || !hasil.ok) {
    throw new Error(
      hasil.error || "Sinkronisasi username gagal."
    );
  }

  return hasil;
}

// LOGIN
loginForm.addEventListener("submit", async function(event) {
  event.preventDefault();

  message.textContent = "Sedang masuk...";

  try {
    if (loginMode === "username") {
      const username = usernameLoginInput.value
        .trim()
        .toLowerCase();

      if (!/^[a-z0-9_]{4,20}$/.test(username)) {
        throw new Error("Username harus 4-20 karakter.");
      }

      const response = await fetch(DATECHAT_AUTH_URL + "/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: username,
          password: password.value
        })
      });

      const hasil = await response.json();

      if (!response.ok || !hasil.email) {
        throw new Error(
          hasil.error || "Username atau password salah."
        );
      }

      await signInWithEmailAndPassword(
        auth,
        hasil.email,
        password.value
      );

    } else {
      await signInWithEmailAndPassword(
        auth,
        email.value.trim(),
        password.value
      );
    }

    message.textContent = "";

  } catch (error) {
    console.error("Login gagal:", error);
    message.textContent = error.message === "Failed to fetch"
      ? "Layanan login tidak dapat dihubungi. Periksa koneksi internet."
      : "Login gagal: " + error.message;
  }
});

// NAVIGASI HALAMAN PENDAFTARAN
registerButton.addEventListener("click", function() {
  bukaHalamanAuth("register");
  registerMessage.textContent = "";
  registerForm.reset();
  registerDisplayName.focus();
});

backToLoginFromRegister.addEventListener("click", function() {
  showScreen("login");
  registerMessage.textContent = "";
});

// PROSES PENDAFTARAN AKUN DATECHAT
registerForm.addEventListener("submit", async function(event) {
  event.preventDefault();

  const displayName = registerDisplayName.value.trim();
  const username = registerUsername.value.trim().replace(/^@/, "").toLowerCase();
  const alamatEmail = registerEmail.value.trim();
  const kataSandi = registerPassword.value;
  const konfirmasiSandi = registerConfirmPassword.value;

  if (!displayName || displayName.length > 40) {
    registerMessage.textContent = "Nama wajib diisi dan maksimal 40 karakter.";
    return;
  }

  if (!/^[a-z0-9_]{4,20}$/.test(username)) {
    registerMessage.textContent = "Username harus 4-20 karakter, hanya huruf kecil, angka, dan garis bawah.";
    return;
  }

  if (kataSandi.length < 6) {
    registerMessage.textContent = "Password minimal 6 karakter.";
    return;
  }

  if (kataSandi !== konfirmasiSandi) {
    registerMessage.textContent = "Konfirmasi password tidak sama.";
    return;
  }

  registerSubmitButton.disabled = true;
  sedangProsesPendaftaran = true;

  try {
    registerMessage.textContent = akunDaftarSementara
      ? "Melanjutkan penyimpanan profil..."
      : "Membuat akun Firebase...";

    if (!akunDaftarSementara) {
      const credential = await createUserWithEmailAndPassword(
        auth, alamatEmail, kataSandi
      );
      akunDaftarSementara = credential.user;
    }

    const userBaru = akunDaftarSementara;
    const userRef = doc(db, "users", userBaru.uid);
    const profileRef = doc(db, "publicProfiles", userBaru.uid);
    const usernameRef = doc(db, "usernames", username);

    registerMessage.textContent = "Menyimpan data akun...";

    await setDoc(userRef, {
      uid: userBaru.uid,
      email: userBaru.email
    }, { merge: true });

    await setDoc(profileRef, {
      uid: userBaru.uid,
      displayName: displayName,
      photoURL: "",
      updatedAt: serverTimestamp()
    }, { merge: true });

    registerMessage.textContent = "Memeriksa ketersediaan username...";

    await runTransaction(db, async function(transaction) {
      const profileSnap = await transaction.get(profileRef);
      const usernameSnap = await transaction.get(usernameRef);

      if (!profileSnap.exists()) {
        throw new Error("Profil akun belum berhasil dibuat. Silakan coba lagi.");
      }

      if (usernameSnap.exists() && usernameSnap.data().uid !== userBaru.uid) {
        throw new Error("Username sudah digunakan orang lain. Silakan pilih username lain.");
      }

      const usernameProfil = profileSnap.data().username || "";
      if (usernameProfil && usernameProfil !== username) {
        throw new Error("Akun ini sudah memiliki username berbeda. Gunakan username tersebut.");
      }

      transaction.update(profileRef, {
        displayName: displayName,
        username: username,
        updatedAt: serverTimestamp()
      });

      if (!usernameSnap.exists()) {
        transaction.set(usernameRef, {
          uid: userBaru.uid,
          username: username,
          createdAt: serverTimestamp()
        });
      }
    });

    registerMessage.textContent = "Menyinkronkan login username...";
    await sinkronkanUsernameKeWorker(userBaru, username);

    akunDaftarSementara = null;
    registerForm.reset();
    registerMessage.textContent = "Pendaftaran berhasil. Mengarahkan ke Login...";

    sedangProsesPendaftaran = false;
    await signOut(auth);

    setLoginMode("username");
    message.textContent =
      "Akun berhasil dibuat. Silakan masuk dengan username atau email.";

  } catch (error) {
    console.error("Pendaftaran gagal:", error);
    registerMessage.textContent = "Pendaftaran belum selesai: " + error.message;
  } finally {
    sedangProsesPendaftaran = false;
    registerSubmitButton.disabled = false;
  }
});

// BERSIHKAN LISTENER PESAN TERAKHIR
function clearLatestListeners() {
  latestUnsubs.forEach(function(unsubscribe) {
    unsubscribe();
  });

  deliveryUnsubs.forEach(function(unsubscribe) {
    unsubscribe();
  });

  latestUnsubs.clear();
  deliveryUnsubs.clear();
  latestMessages.clear();

  partnerProfileUnsubs.forEach(function(unsubscribe) {
    unsubscribe();
  });
  partnerProfileUnsubs.clear();
  partnerProfiles.clear();
}

// TAMPILKAN FOTO PROFIL
function tampilkanAvatar(container, photoURL) {
  container.replaceChildren();

  if (photoURL) {
    const img = document.createElement("img");
    img.src = photoURL;
    img.alt = "Foto profil";
    img.onerror = function() {
      container.textContent = "👤";
    };
    container.appendChild(img);
  } else {
    container.textContent = "👤";
  }
}

// PEMBESAR AVATAR PROFIL DAN LAWAN CHAT
function bukaTampilanAvatar(container, keterangan) {
  let viewer = document.getElementById("datechat-photo-viewer");

  if (!viewer) {
    viewer = document.createElement("div");
    viewer.id = "datechat-photo-viewer";
    viewer.className = "photo-viewer";
    viewer.hidden = true;

    const gambar = document.createElement("img");
    gambar.className = "photo-viewer-image";
    gambar.alt = "Foto profil";

    const ikon = document.createElement("div");
    ikon.className = "photo-viewer-placeholder";
    ikon.textContent = "👤";

    const tutup = document.createElement("button");
    tutup.type = "button";
    tutup.className = "photo-viewer-close";
    tutup.textContent = "×";
    tutup.setAttribute("aria-label", "Tutup foto");

    tutup.addEventListener("click", function() {
      viewer.hidden = true;
    });

    viewer.addEventListener("click", function(event) {
      if (event.target === viewer) viewer.hidden = true;
    });

    viewer.appendChild(gambar);
    viewer.appendChild(ikon);
    viewer.appendChild(tutup);
    document.body.appendChild(viewer);
  }

  const foto = container.querySelector("img");
  const gambarBesar = viewer.querySelector(".photo-viewer-image");
  const ikonBesar = viewer.querySelector(".photo-viewer-placeholder");

  if (foto && foto.src) {
    gambarBesar.src = foto.src;
    gambarBesar.alt = keterangan;
    gambarBesar.hidden = false;
    ikonBesar.hidden = true;
  } else {
    gambarBesar.removeAttribute("src");
    gambarBesar.hidden = true;
    ikonBesar.hidden = false;
  }

  viewer.hidden = false;
}

profileAvatar.addEventListener("click", function() {
  bukaTampilanAvatar(profileAvatar, "Foto profil saya");
});

document.getElementById("partnerAvatar").addEventListener("click", function() {
  bukaTampilanAvatar(this, "Foto profil lawan chat");
});

const partnerProfilePanel = document.getElementById("partnerProfilePanel");
const closePartnerProfileButton = document.getElementById("closePartnerProfile");
const partnerProfileAvatar = document.getElementById("partnerProfileAvatar");
const partnerProfileName = document.getElementById("partnerProfileName");
const partnerProfileUsername = document.getElementById("partnerProfileUsername");

document.getElementById("partnerName").addEventListener("click", function() {
  partnerProfileName.textContent =
    currentPartnerProfile.displayName || "Pengguna DateChat";

  partnerProfileUsername.textContent =
    currentPartnerProfile.username
      ? "@" + currentPartnerProfile.username.replace(/^@/, "")
      : "Username belum tersedia";

  tampilkanAvatar(partnerProfileAvatar, currentPartnerProfile.photoURL);
  partnerProfilePanel.hidden = false;
});

closePartnerProfileButton.addEventListener("click", function() {
  partnerProfilePanel.hidden = true;
});

// MENU TIGA TITIK BERANDA
const homeMenuToggle = document.getElementById("homeMenuToggle");
const homeMenuPanel = document.getElementById("homeMenuPanel");

homeMenuToggle.addEventListener("click", function() {
  homeMenuPanel.hidden = !homeMenuPanel.hidden;
  homeMenuToggle.setAttribute("aria-expanded", String(!homeMenuPanel.hidden));
});

openProfileButton.addEventListener("click", function() {
  homeMenuPanel.hidden = true;
  homeMenuToggle.setAttribute("aria-expanded", "false");
  profilePanel.hidden = false;
});

closeSettingsButton.addEventListener("click", function() {
  bukaBagianBeranda("chats");
});

closeProfileButton.addEventListener("click", function() {
  profilePanel.hidden = true;
});

// PILIH FOTO PROFIL
chooseProfilePhotoButton.addEventListener("click", function() {
  profilePhotoInput.click();
});

takeProfilePhotoButton.addEventListener("click", function() {
  profileCameraInput.click();
});

removeProfilePhotoButton.addEventListener("click", function() {
  if (!currentProfile.photoURL && !selectedProfileFile) {
    profileStatus.textContent = "Belum ada foto profil untuk dihapus.";
    return;
  }

  if (!confirm("Hapus foto profil kamu? Perubahan berlaku setelah menekan Simpan Profil.")) {
    return;
  }

  selectedProfileFile = null;
  removeProfilePhotoRequested = Boolean(currentProfile.photoURL);

  profilePhotoInput.value = "";
  profileCameraInput.value = "";

  tampilkanAvatar(
    profileAvatar,
    removeProfilePhotoRequested ? "" : currentProfile.photoURL
  );

  profileStatus.textContent = removeProfilePhotoRequested
    ? "Foto akan dihapus setelah kamu menekan Simpan Profil."
    : "Pilihan foto baru dibatalkan.";
});

function prosesFotoProfil(file) {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    profileStatus.textContent = "Pilih file gambar.";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    profileStatus.textContent = "Ukuran foto maksimal 5 MB.";
    return;
  }

  selectedProfileFile = file;
  removeProfilePhotoRequested = false;
  const previewURL = URL.createObjectURL(file);
  tampilkanAvatar(profileAvatar, previewURL);
  profileStatus.textContent = "Foto siap digunakan. Tekan Simpan Profil nanti.";
}

profilePhotoInput.addEventListener("change", function() {
  prosesFotoProfil(this.files[0]);
});

profileCameraInput.addEventListener("change", function() {
  prosesFotoProfil(this.files[0]);
});

// UNGGAH FOTO KE CLOUDINARY
async function unggahFotoProfil(file) {
  const formData = new FormData();
  formData.append("file", fileUpload);
  formData.append("upload_preset", "datechat_profiles");

  const response = await fetch(
    "https://api.cloudinary.com/v1_1/snob7efz/image/upload",
    {
      method: "POST",
      body: formData
    }
  );

  const hasil = await response.json();

  if (!response.ok) {
    throw new Error(
      hasil.error?.message || "Gagal mengunggah foto profil."
    );
  }

  return hasil.secure_url;
}

// SIMPAN PROFIL DAN KLAIM USERNAME
saveProfileButton.addEventListener("click", async function() {
  if (!currentUser) return;

  const displayName = profileNameInput.value.trim();
  const usernameInput = profileUsernameInput.value
    .trim()
    .replace(/^@/, "")
    .toLowerCase();

  const usernameSaatIni = currentProfile.username || "";

  if (!displayName) {
    profileStatus.textContent = "Nama tampilan tidak boleh kosong.";
    return;
  }

  if (displayName.length > 40) {
    profileStatus.textContent = "Nama maksimal 40 karakter.";
    return;
  }

  if (
    usernameInput &&
    !/^[a-z0-9_]{4,20}$/.test(usernameInput)
  ) {
    profileStatus.textContent =
      "Username harus 4-20 karakter, hanya huruf kecil, angka, dan garis bawah.";
    return;
  }

  if (
    usernameSaatIni &&
    usernameInput &&
    usernameInput !== usernameSaatIni
  ) {
    profileStatus.textContent =
      "Username yang sudah diklaim tidak bisa diganti.";
    return;
  }

  const usernameBaru = !usernameSaatIni
    ? usernameInput
    : "";

  saveProfileButton.disabled = true;
  profileStatus.textContent = "Menyimpan profil...";

  try {
    let photoURL = removeProfilePhotoRequested
      ? ""
      : currentProfile.photoURL;

    if (selectedProfileFile) {
      profileStatus.textContent = "Mengunggah foto...";
      photoURL = await unggahFotoProfil(selectedProfileFile);
    }

    const profileRef = doc(
      db,
      "publicProfiles",
      currentUser.uid
    );

    if (usernameBaru) {
      profileStatus.textContent = "Memeriksa ketersediaan username...";

      await runTransaction(db, async (transaction) => {
        const profileSnap = await transaction.get(profileRef);

        if (!profileSnap.exists()) {
          throw new Error("Profil pengguna tidak ditemukan.");
        }

        const usernameRef = doc(
          db,
          "usernames",
          usernameBaru
        );

        const usernameSnap = await transaction.get(usernameRef);

        if (usernameSnap.exists()) {
          throw new Error("Username sudah digunakan orang lain.");
        }

        if (profileSnap.data().username) {
          throw new Error("Akun ini sudah memiliki username.");
        }

        transaction.update(profileRef, {
          displayName: displayName,
          photoURL: photoURL,
          username: usernameBaru,
          updatedAt: serverTimestamp()
        });

        transaction.set(usernameRef, {
          uid: currentUser.uid,
          username: usernameBaru,
          createdAt: serverTimestamp()
        });
      });

    } else {
      await updateDoc(profileRef, {
        displayName: displayName,
        photoURL: photoURL,
        updatedAt: serverTimestamp()
      });
    }

    currentProfile = {
      displayName: displayName,
      photoURL: photoURL,
      username: usernameSaatIni || usernameBaru
    };

    profileUsernameInput.value = currentProfile.username;

    selectedProfileFile = null;
    removeProfilePhotoRequested = false;
    profilePhotoInput.value = "";
    profileCameraInput.value = "";

    tampilkanAvatar(profileAvatar, photoURL);

    if (currentProfile.username) {
      try {
        profileStatus.textContent = "Profil tersimpan. Menyinkronkan username...";

        await sinkronkanUsernameKeWorker(
          currentUser,
          currentProfile.username
        );

        profileStatus.textContent =
          "Profil berhasil disimpan. Username: @" +
          currentProfile.username;

      } catch (syncError) {
        console.warn("Sinkronisasi username gagal:", syncError);

        profileStatus.textContent =
          "Profil tersimpan, tetapi sinkronisasi login username gagal. Coba simpan profil lagi.";
      }
    } else {
      profileStatus.textContent =
        "Profil berhasil disimpan. Silakan pilih username kamu.";
    }

  } catch (error) {
    console.error(error);
    profileStatus.textContent =
      "Gagal menyimpan: " + error.message;
  } finally {
    saveProfileButton.disabled = false;
  }
});

// STATUS LOGIN
onAuthStateChanged(auth, async function(user) {
  currentUser = user;

  // TAHAN NAVIGASI OTOMATIS SELAMA PROSES PENDAFTARAN
  if (sedangProsesPendaftaran) return;

  // RESET PANEL SAAT STATUS LOGIN BERUBAH
  settingsPanel.hidden = true;

  if (stopMessages) stopMessages();
  if (stopHiddenMessages) stopHiddenMessages();
  if (stopHiddenChats) stopHiddenChats();
  if (stopFriendRequests) stopFriendRequests();
  if (stopFriendships) stopFriendships();
  if (stopPartnerProfile) stopPartnerProfile();
  if (stopPartnerPresence) stopPartnerPresence();
  if (stopRooms) stopRooms();

  clearLatestListeners();

  stopMessages = null;
  stopHiddenChats = null;
  stopFriendRequests = null;
  stopFriendships = null;
  hiddenChats.clear();
  hiddenChatsLoaded = false;
  stopPartnerProfile = null;
  stopPartnerPresence = null;
  stopRooms = null;
  currentRoomId = null;

  const statusOnlineHeader = document.getElementById("partnerOnlineStatus");
  if (statusOnlineHeader) statusOnlineHeader.hidden = true;
  roomsCache = [];

  if (!user) {
    showScreen("login");
    return;
  }

  try {
    const profilRef = doc(db, "users", user.uid);
    const profilSnap = await getDoc(profilRef);

    if (!profilSnap.exists()) {
      await setDoc(profilRef, {
        uid: user.uid,
        email: user.email
      });
    }

    // MUAT PENGATURAN PRIVASI DARI FIREBASE
    await loadPrivacySettingsFromFirebase(
      profilSnap.exists()
        ? profilSnap.data()
        : { uid: user.uid, email: user.email }
    );

    // AKTIFKAN STATUS ONLINE SETELAH PRIVASI DIMUAT
    await mulaiPresenceSendiri(user);

    // MUAT PROFIL PUBLIK
    const publicProfileRef = doc(db, "publicProfiles", user.uid);
    const publicProfileSnap = await getDoc(publicProfileRef);

    if (!publicProfileSnap.exists()) {
      const namaAwal = (user.email || "Pengguna")
        .split("@")[0]
        .slice(0, 40);

      await setDoc(publicProfileRef, {
        uid: user.uid,
        displayName: namaAwal,
        photoURL: "",
        updatedAt: serverTimestamp()
      });

      currentProfile = {
        displayName: namaAwal,
        photoURL: "",
        username: ""
      };
    } else {
      const dataProfil = publicProfileSnap.data();

      currentProfile = {
        displayName: dataProfil.displayName || "Pengguna",
        photoURL: dataProfil.photoURL || "",
        username: dataProfil.username || ""
      };
    }

    profileNameInput.value = currentProfile.displayName;
    profileUsernameInput.value = currentProfile.username;
    tampilkanAvatar(profileAvatar, currentProfile.photoURL);

    homeMenuPanel.hidden = true;
homeMenuToggle.setAttribute("aria-expanded", "false");
showScreen("home");
    loadHiddenChats();
    loadConversations();
    loadFriendRequests();
    loadFriendships();

  } catch (error) {
    console.error(error);
    showScreen("login");
    alert("Gagal memuat profil: " + error.message);
  }
});


// MEMUAT PERMINTAAN TEMAN MASUK
function loadFriendRequests() {
  if (!currentUser) return;

  const daftar = document.getElementById("friendRequestList");
  const permintaanQuery = query(
    collection(db, "friendRequests"),
    where("recipientId", "==", currentUser.uid)
  );

  stopFriendRequests = onSnapshot(
    permintaanQuery,
    async function(snapshot) {
      const masuk = snapshot.docs.filter(function(item) {
        return item.data().status === "pending";
      });

      ["notificationBadge", "menuNotificationBadge"].forEach(function(id) {
        const badge = document.getElementById(id);
        if (badge) {
          badge.textContent = masuk.length > 99 ? "99+" : String(masuk.length);
          badge.hidden = masuk.length === 0;
        }
      });

      daftar.replaceChildren();

      if (masuk.length === 0) {
        daftar.textContent = "Belum ada permintaan teman.";
        return;
      }

      for (const item of masuk) {
        const data = item.data();
        const profilSnap = await getDoc(
          doc(db, "publicProfiles", data.senderId)
        );

        if (!currentUser) return;

        const profil = profilSnap.exists() ? profilSnap.data() : {};
        const kartu = document.createElement("div");
        kartu.className = "friend-search-card";

        const informasi = document.createElement("div");
        const nama = document.createElement("strong");
        nama.textContent = profil.displayName || "Pengguna DateChat";

        const username = document.createElement("p");
        username.textContent = profil.username
          ? "@" + profil.username
          : "Permintaan pertemanan";

        informasi.append(nama, username);
        kartu.appendChild(informasi);

        const terima = document.createElement("button");
        terima.type = "button";
        terima.textContent = "Terima";
        terima.addEventListener("click", function() {
          acceptFriendRequest(item.id, data);
        });

        const tolak = document.createElement("button");
        tolak.type = "button";
        tolak.textContent = "Tolak";
        tolak.addEventListener("click", async function() {
          tolak.disabled = true;
          try {
            await updateDoc(doc(db, "friendRequests", item.id), {
              status: "rejected",
              updatedAt: serverTimestamp()
            });
          } catch (error) {
            console.error(error);
            alert("Gagal menolak permintaan: " + error.message);
            tolak.disabled = false;
          }
        });

        kartu.append(terima, tolak);
        daftar.appendChild(kartu);
      }
    },
    function(error) {
      console.error("Gagal memuat permintaan teman:", error);
      daftar.textContent = "Gagal memuat permintaan teman.";
    }
  );
}

// MENERIMA PERMINTAAN TEMAN
async function acceptFriendRequest(requestId, data) {
  if (!currentUser || currentUser.uid !== data.recipientId) return;

  try {
    const batch = writeBatch(db);
    const requestRef = doc(db, "friendRequests", requestId);
    const friendshipRef = doc(db, "friendships", requestId);

    batch.set(friendshipRef, {
      requestId: requestId,
      senderId: data.senderId,
      recipientId: data.recipientId,
      members: [data.senderId, data.recipientId],
      createdAt: serverTimestamp()
    });

    batch.update(requestRef, {
      status: "accepted",
      updatedAt: serverTimestamp()
    });

    await batch.commit();
    alert("Permintaan teman diterima.");
  } catch (error) {
    console.error("Gagal menerima teman:", error);
    alert("Gagal menerima permintaan: " + error.message);
  }
}

// MEMBUKA ATAU MEMBUAT CHAT DENGAN TEMAN
async function bukaChatDenganTeman(friendUid) {
  if (!currentUser) return;

  const uidSaya = currentUser.uid;

  try {
    const ruangSnap = await getDocs(query(
      collection(db, "rooms"),
      where("members", "array-contains", uidSaya)
    ));

    if (!currentUser || currentUser.uid !== uidSaya) return;

    const ruangAda = ruangSnap.docs.find(function(item) {
      const data = item.data();
      return Array.isArray(data.members) &&
        data.members.includes(friendUid);
    });

    let roomId;
    let dataRuang;

    if (ruangAda) {
      roomId = ruangAda.id;

      await updateDoc(ruangAda.ref, {
        friendshipRequired: true
      });

      dataRuang = {
        id: roomId,
        ...ruangAda.data(),
        friendshipRequired: true
      };
    } else {
      const ruangBaru = await addDoc(collection(db, "rooms"), {
        type: "private",
        members: [uidSaya, friendUid],
        createdBy: uidSaya,
        createdAt: serverTimestamp(),
        friendshipRequired: true
      });

      roomId = ruangBaru.id;
      dataRuang = {
        id: roomId,
        type: "private",
        members: [uidSaya, friendUid],
        createdBy: uidSaya,
        friendshipRequired: true
      };
    }

    if (!currentUser || currentUser.uid !== uidSaya) return;

    const index = roomsCache.findIndex(function(room) {
      return room.id === roomId;
    });

    if (index === -1) {
      roomsCache.push(dataRuang);
    } else {
      roomsCache[index] = dataRuang;
    }

    updateLatestListeners();
    renderConversations();
    openRoom(roomId);

  } catch (error) {
    console.error("Gagal membuka chat teman:", error);
    alert("Gagal membuka chat: " + error.message);
  }
}

// MENGHAPUS PERTEMANAN
async function hapusTeman(item) {
  if (!currentUser || !item || !item.friendshipId || !item.requestId) {
    alert("Data pertemanan tidak lengkap.");
    return;
  }

  const uidSaya = currentUser.uid;
  const friendUid = item.uid;
  const nama = item.profil.displayName || "teman ini";

  const yakin = confirm(
    "Hapus " + nama + " dari daftar teman?\n\n" +
    "Riwayat chat lama tetap tersimpan, tetapi kalian harus berteman lagi " +
    "untuk mengirim pesan baru."
  );

  if (!yakin) return;

  try {
    const ruangSnap = await getDocs(query(
      collection(db, "rooms"),
      where("members", "array-contains", uidSaya)
    ));

    if (!currentUser || currentUser.uid !== uidSaya) return;

    const ruangBersama = ruangSnap.docs.filter(function(ruang) {
      const data = ruang.data();
      return Array.isArray(data.members) &&
        data.members.includes(friendUid);
    });

    if (ruangBersama.length > 498) {
      throw new Error("Terlalu banyak ruang chat untuk diproses sekaligus.");
    }

    const batch = writeBatch(db);

    ruangBersama.forEach(function(ruang) {
      batch.update(ruang.ref, {
        friendshipRequired: true
      });
    });

    batch.delete(doc(db, "friendships", item.friendshipId));
    batch.delete(doc(db, "friendRequests", item.requestId));

    await batch.commit();

    alert("Pertemanan berhasil dihapus. Riwayat chat tetap tersimpan.");
  } catch (error) {
    console.error("Gagal menghapus teman:", error);
    alert("Gagal menghapus teman: " + error.message);
  }
}

// MEMUAT DAFTAR TEMAN
function loadFriendships() {
  if (!currentUser) return;

  const daftar = document.getElementById("friendList");
  const temanQuery = query(
    collection(db, "friendships"),
    where("members", "array-contains", currentUser.uid)
  );

  stopFriendships = onSnapshot(
    temanQuery,
    async function(snapshot) {
      const teman = await Promise.all(
        snapshot.docs.map(async function(item) {
          const data = item.data();
          const friendUid = data.members.find(function(uid) {
            return uid !== currentUser.uid;
          });

          if (!friendUid) return null;

          const profilSnap = await getDoc(
            doc(db, "publicProfiles", friendUid)
          );

          return {
            uid: friendUid,
            friendshipId: item.id,
            requestId: data.requestId || item.id,
            senderId: data.senderId,
            recipientId: data.recipientId,
            profil: profilSnap.exists() ? profilSnap.data() : {}
          };
        })
      );

      if (!currentUser) return;

      daftar.replaceChildren();

      friendProfiles = teman.filter(Boolean);
      const hasil = friendProfiles;

      if (hasil.length === 0) {
        daftar.textContent = "Belum ada teman.";
        return;
      }

      hasil.forEach(function(item) {
        const kartu = document.createElement("div");
        kartu.className = "friend-search-card";

        const nama = document.createElement("strong");
        nama.textContent = item.profil.displayName || "Pengguna DateChat";

        const username = document.createElement("p");
        username.textContent = item.profil.username
          ? "@" + item.profil.username
          : "Teman DateChat";

        kartu.append(nama, username);

        const tombolChat = document.createElement("button");
        tombolChat.type = "button";
        tombolChat.textContent = "Chat";
        tombolChat.addEventListener("click", function() {
          bukaChatDenganTeman(item.uid);
        });

        kartu.appendChild(tombolChat);

        const tombolHapus = document.createElement("button");
        tombolHapus.type = "button";
        tombolHapus.textContent = "Hapus Teman";
        tombolHapus.addEventListener("click", function() {
          hapusTeman(item);
        });

        kartu.appendChild(tombolHapus);
        daftar.appendChild(kartu);
      });
    },
    function(error) {
      console.error("Gagal memuat daftar teman:", error);
      daftar.textContent = "Gagal memuat daftar teman.";
    }
  );
}

// MEMUAT CHAT YANG DISEMBUNYIKAN
function loadHiddenChats() {
  if (!currentUser) return;

  hiddenChatsLoaded = false;

  const hiddenChatsRef = collection(
    db,
    "users",
    currentUser.uid,
    "hiddenChats"
  );

  stopHiddenChats = onSnapshot(
    hiddenChatsRef,
    function(snapshot) {
      hiddenChats.clear();

      snapshot.forEach(function(item) {
        hiddenChats.set(item.id, item.data());
      });

      hiddenChatsLoaded = true;
      renderConversations();
      if (currentRoomId && !chatScreen.hidden) openRoom(currentRoomId);
    },
    function(error) {
      console.error("Gagal memuat chat tersembunyi:", error);
      alert("Gagal memuat daftar chat: " + error.message);
    }
  );
}

// MEMUAT DAFTAR RUANG
function loadConversations() {
  if (!currentUser) return;

  const ruangQuery = query(
    collection(db, "rooms"),
    where("members", "array-contains", currentUser.uid)
  );

  stopRooms = onSnapshot(
    ruangQuery,
    function(snapshot) {
      roomsCache = snapshot.docs.map(function(item) {
        return {
          id: item.id,
          ...item.data()
        };
      });

      updateLatestListeners();
      renderConversations();
    },
    function(error) {
      console.error("Gagal memuat ruang:", error);
      alert("Gagal memuat percakapan: " + error.message);
    }
  );
}

// MENANGANI NOTIFIKASI PESAN BARU
async function handleIncomingMessageNotification(roomId, data) {
  if (!notificationSettings.enabled || !currentUser) return;
  if (!data || data.senderId === currentUser.uid) return;

  // Jangan beri notifikasi jika ruang chat tersebut sedang dibuka.
  if (currentRoomId === roomId && !chatScreen.hidden) return;

  const profil = partnerProfiles.get(roomId) || {};
  const judul = profil.displayName || "Pesan baru";

  const isiPesan = notificationSettings.preview
    ? (data.text || (data.mediaUrl ? "Mengirim media" : "Mengirim pesan"))
    : "Kamu menerima pesan baru";

  // Getar jika perangkat mendukung Vibration API.
  if (notificationSettings.vibration && navigator.vibrate) {
    navigator.vibrate([120, 60, 120]);
  }

  // Bunyi singkat menggunakan Web Audio API.
  if (notificationSettings.sound) {
    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (AudioContextClass) {
        const audioContext = new AudioContextClass();

        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = 880;
        gain.gain.setValueAtTime(0.08, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          audioContext.currentTime + 0.18
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.18);
        oscillator.onended = function() {
          audioContext.close();
        };
      }
    } catch (error) {
      console.warn("Suara notifikasi tidak dapat diputar:", error);
    }
  }

  // Notifikasi sistem hanya ditampilkan saat halaman tidak aktif.
  if (
    document.hidden &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    try {
      const opsi = {
        body: isiPesan,
        tag: "datechat-" + roomId
      };

      if ("serviceWorker" in navigator) {
        const registrasi = await navigator.serviceWorker.getRegistration();

        if (registrasi && registrasi.showNotification) {
          await registrasi.showNotification(judul, opsi);
          return;
        }
      }

      const pemberitahuan = new Notification(judul, opsi);

      pemberitahuan.onclick = function() {
        window.focus();
        openRoom(roomId);
        pemberitahuan.close();
      };
    } catch (error) {
      console.warn("Notifikasi browser gagal ditampilkan:", error);
    }
  }
}

// MENDENGARKAN PESAN TERAKHIR SETIAP RUANG
function updateLatestListeners() {
  const roomIds = new Set(
    roomsCache.map(function(room) {
      return room.id;
    })
  );

  latestUnsubs.forEach(function(unsubscribe, roomId) {
    if (!roomIds.has(roomId)) {
      unsubscribe();
      latestUnsubs.delete(roomId);
      latestMessages.delete(roomId);

      if (partnerProfileUnsubs.has(roomId)) {
        partnerProfileUnsubs.get(roomId)();
        partnerProfileUnsubs.delete(roomId);
      }
      partnerProfiles.delete(roomId);
    }
  });

  deliveryUnsubs.forEach(function(unsubscribe, roomId) {
    if (!roomIds.has(roomId)) {
      unsubscribe();
      deliveryUnsubs.delete(roomId);
    }
  });

  roomsCache.forEach(function(room) {
    const partnerUid = Array.isArray(room.members)
      ? room.members.find(function(uid) {
          return uid !== currentUser.uid;
        })
      : null;

    if (partnerUid && !partnerProfileUnsubs.has(room.id)) {
      const stopProfil = onSnapshot(
        doc(db, "publicProfiles", partnerUid),
        function(snapshot) {
          partnerProfiles.set(
            room.id,
            snapshot.exists() ? snapshot.data() : {}
          );
          renderConversations();
        },
        function(error) {
          console.error("Gagal memuat profil teman di daftar chat:", error);
          partnerProfiles.set(room.id, {});
          renderConversations();
        }
      );

      partnerProfileUnsubs.set(room.id, stopProfil);
    }

    // LISTENER PESAN TERAKHIR
    if (!latestUnsubs.has(room.id)) {
      const pesanTerakhirQuery = query(
        collection(db, "rooms", room.id, "messages"),
        orderBy("createdAt", "desc"),
        limit(1)
      );

      let latestSnapshotInitialized = false;

      const unsubscribe = onSnapshot(
        pesanTerakhirQuery,
        { includeMetadataChanges: true },
        function(snapshot) {
          // Abaikan data cache dan snapshot pertama agar pesan lama
          // tidak dianggap sebagai pesan baru.
          if (!latestSnapshotInitialized) {
            if (!snapshot.metadata.fromCache) {
              latestSnapshotInitialized = true;
            }
          } else {
            snapshot.docChanges().forEach(function(change) {
              if (change.type !== "added") return;

              const data = change.doc.data();
              handleIncomingMessageNotification(room.id, data);
            });
          }

          latestMessages.set(
            room.id,
            snapshot.empty ? null : snapshot.docs[0].data()
          );

          renderConversations();
        },
        function(error) {
          console.error("Gagal memuat pesan terakhir:", error);
        }
      );

      latestUnsubs.set(room.id, unsubscribe);
    }

    // LISTENER STATUS PESAN DITERIMA
    if (!deliveryUnsubs.has(room.id)) {
      const pesanMasukQuery = query(
        collection(db, "rooms", room.id, "messages"),
        orderBy("createdAt", "desc"),
        limit(50)
      );

      const stopDelivery = onSnapshot(
        pesanMasukQuery,
        function(snapshot) {
          let jumlahBelumDibaca = 0;

          snapshot.forEach(function(item) {
            const data = item.data();

            tandaiPesanDiterima(room.id, item.id, data);

            const sudahDibaca = Array.isArray(data.readBy)
              && data.readBy.includes(currentUser.uid);

            if (
              data.senderId !== currentUser.uid &&
              !sudahDibaca
            ) {
              jumlahBelumDibaca++;
            }
          });

          unreadCounts.set(room.id, jumlahBelumDibaca);
          renderConversations();
        },
        function(error) {
          console.error("Gagal memantau pesan diterima:", error);
        }
      );

      deliveryUnsubs.set(room.id, stopDelivery);
    }
  });
}

// TAMPILKAN DAFTAR CHAT
function renderConversations() {
  const list = document.getElementById("conversationList");
  list.innerHTML = "";

  if (!hiddenChatsLoaded) {
    list.textContent = "Memuat percakapan...";
    return;
  }

  const kataKunci = searchInput.value.trim().toLowerCase();

  if (
    kataKunci &&
    homeMessageSearchLoading &&
    homeMessageSearchTerm === kataKunci
  ) {
    list.textContent = "Mencari nama, username, dan isi pesan...";
    return;
  }


  const filtered = roomsCache.filter(function(room) {
    const cocokFilter =
      currentFilter === "all" || room.type === currentFilter;

    const profilTeman = partnerProfiles.get(room.id) || {};
    const namaTeman = (profilTeman.displayName || "").toLowerCase();
    const usernameTeman = (profilTeman.username || "").toLowerCase();

    const pesanCocok = homeMessageMatches.get(room.id);
    const cocokNama =
      room.id.toLowerCase().includes(kataKunci) ||
      namaTeman.includes(kataKunci) ||
      usernameTeman.includes(kataKunci);
    const cocokCari = !kataKunci || cocokNama || Boolean(pesanCocok);

    const statusChat = hiddenChats.get(room.id) || {};
    const waktuDihapus = statusChat.deletedAt;
    const pesanTerakhir = latestMessages.get(room.id);

    if (waktuDihapus) {
      const batasHapus = waktuDihapus.toMillis
        ? waktuDihapus.toMillis()
        : 0;
      const waktuPesan = pesanTerakhir?.createdAt?.toMillis?.() || 0;

      if (!pesanTerakhir || waktuPesan <= batasHapus) {
        return false;
      }
    }

    return cocokFilter && cocokCari;
  });

  filtered.sort(function(a, b) {
    const pesanA = latestMessages.get(a.id);
    const pesanB = latestMessages.get(b.id);

    const waktuA = pesanA?.createdAt?.toMillis?.() || 0;
    const waktuB = pesanB?.createdAt?.toMillis?.() || 0;

    return waktuB - waktuA;
  });

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-conversation";

    const icon = document.createElement("div");
    icon.textContent = "✉️";

    const title = document.createElement("h3");
    title.textContent = kataKunci
      ? "Percakapan tidak ditemukan"
      : "Belum ada percakapan";

    const info = document.createElement("p");
    info.textContent = kataKunci
      ? "Coba kata lain, nama teman, username, atau isi pesan."
      : "Tekan tombol + untuk memulai percakapan.";

    empty.append(icon, title, info);
    list.appendChild(empty);
    return;
  }

  filtered.forEach(function(room) {
    const card = document.createElement("div");
    card.className = "menu-card";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "conversation-open";

    const avatar = document.createElement("div");
      avatar.className = "conversation-avatar";

      const profilTeman = partnerProfiles.get(room.id) || {};
      tampilkanAvatar(avatar, profilTeman.photoURL);

      const content = document.createElement("span");
      content.className = "conversation-content";
      content.style.flex = "1";
      content.style.minWidth = "0";

    const title = document.createElement("strong");
    title.textContent = profilTeman.displayName ||
      "Memuat profil teman...";

    const username = document.createElement("small");
    username.className = "conversation-username";
    username.textContent = profilTeman.username
      ? "@" + profilTeman.username
      : "";

    const detail = document.createElement("small");
    const lastMessage = latestMessages.get(room.id);
    const pesanCocok = homeMessageMatches.get(room.id);
    detail.textContent = pesanCocok
      ? "Pesan cocok: " + pesanCocok.text
      : lastMessage
        ? lastMessage.text || "Pesan"
        : "Belum ada pesan";

    const meta = document.createElement("span");
      meta.className = "conversation-meta";

      const time = document.createElement("small");
      time.className = "conversation-time";
      time.textContent = lastMessage
        ? formatConversationTime(lastMessage.createdAt)
        : "Baru";

      const badge = document.createElement("span");
      badge.className = "conversation-unread-badge";
      const jumlahBelumDibaca = unreadCounts.get(room.id) || 0;
      badge.textContent = jumlahBelumDibaca > 99
        ? "99+"
        : String(jumlahBelumDibaca);
      badge.hidden = jumlahBelumDibaca === 0;

      content.append(title, username, detail);
      meta.append(time, badge);
      button.append(avatar, content, meta);

    const menu = document.createElement("div");
    menu.className = "conversation-menu";
    menu.hidden = true;

    const bersihkanButton = document.createElement("button");
    bersihkanButton.type = "button";
    bersihkanButton.textContent = "Bersihkan riwayat";
    bersihkanButton.addEventListener("click", function(event) {
      event.stopPropagation();
      menu.hidden = true;
      bersihkanRiwayatChat(room.id);
    });

    const hapusButton = document.createElement("button");
    hapusButton.type = "button";
    hapusButton.textContent = "Hapus chat";
    hapusButton.addEventListener("click", function(event) {
      event.stopPropagation();
      menu.hidden = true;
      hapusChatDariDaftar(room.id);
    });

    menu.append(bersihkanButton, hapusButton);

    let timerTekanChat = null;
    let tekanLamaChatAktif = false;

    function tampilkanMenuChat() {
      list.querySelectorAll(".conversation-menu").forEach(function(menuLain) {
        menuLain.hidden = true;
      });
      menu.hidden = false;
    }

    button.addEventListener("pointerdown", function(event) {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      tekanLamaChatAktif = false;
      clearTimeout(timerTekanChat);

      timerTekanChat = setTimeout(function() {
        tekanLamaChatAktif = true;
        tampilkanMenuChat();
      }, 500);
    });

    ["pointerup", "pointerleave", "pointercancel"].forEach(function(jenisEvent) {
      button.addEventListener(jenisEvent, function() {
        clearTimeout(timerTekanChat);
      });
    });

    button.addEventListener("contextmenu", function(event) {
      event.preventDefault();
      tekanLamaChatAktif = true;
      tampilkanMenuChat();
    });

    button.addEventListener("click", function(event) {
      if (button.dataset.tutupMenuSaja === "1") {
        delete button.dataset.tutupMenuSaja;
        event.preventDefault();
        event.stopPropagation();
        tekanLamaChatAktif = false;
        return;
      }

      if (tekanLamaChatAktif) {
        event.preventDefault();
        event.stopPropagation();
        tekanLamaChatAktif = false;
        return;
      }

      openRoom(room.id);
    });

    card.append(button, menu);
    list.appendChild(card);
  });
}

// TUTUP MENU CHAT SAAT AREA DI LUAR DISENTUH
document.addEventListener("pointerdown", function(event) {
  const menuTerbuka = document.querySelector(
    "#conversationList .conversation-menu:not([hidden])"
  );

  if (!menuTerbuka || menuTerbuka.contains(event.target)) return;

  const kartuMenu = menuTerbuka.closest(".menu-card");
  const kartuDituju = event.target.closest("#conversationList .menu-card");
  const tombolChat = event.target.closest("#conversationList .conversation-open");

  if (kartuMenu && kartuDituju === kartuMenu && tombolChat) {
    tombolChat.dataset.tutupMenuSaja = "1";
  }

  menuTerbuka.hidden = true;
}, true);

// TUTUP MENU AKSI PESAN SAAT AREA DI LUAR PESAN DISENTUH
document.addEventListener("pointerdown", function(event) {
  const menuPesanTerbuka = document.querySelectorAll(
    ".message-bubble.message-actions-visible"
  );

  menuPesanTerbuka.forEach(function(bubble) {
    if (!bubble.contains(event.target)) {
      bubble.classList.remove("message-actions-visible");
    }
  });
}, true);

// EDIT PESAN - PANEL BAWAH SEPERTI WHATSAPP
async function editMessage(roomId, messageId, teksLama) {
  const panel = document.getElementById("messageEditPanel");
  const textarea = document.getElementById("messageEditTextarea");
  const chatForm = document.getElementById("chatForm");
  const tombolSimpan = document.getElementById("saveMessageEdit");
  const tombolBatal = document.getElementById("cancelMessageEdit");
  const tombolBatalBawah = document.getElementById("cancelMessageEditBottom");

  if (!panel || !textarea || !chatForm || !tombolSimpan) {
    alert("Panel edit pesan belum tersedia.");
    return;
  }

  if (!panel.hidden) return;

  // Tutup toolbar pemilihan pesan saat editor dibuka
  if (typeof batalPilihPesanAksi === "function") {
    batalPilihPesanAksi();
  }

  textarea.value = teksLama || "";
  panel.hidden = false;
  chatForm.hidden = true;

  function tutupEditor() {
    panel.hidden = true;
    chatForm.hidden = false;
    textarea.value = "";
    tombolSimpan.disabled = false;
    tombolSimpan.textContent = "Simpan perubahan";
  }

  function batalEdit() {
    tutupEditor();
  }

  if (!tombolBatal.dataset.editBound) {
    tombolBatal.addEventListener("click", batalEdit);
    tombolBatal.dataset.editBound = "1";
  }

  if (!tombolBatalBawah.dataset.editBound) {
    tombolBatalBawah.addEventListener("click", batalEdit);
    tombolBatalBawah.dataset.editBound = "1";
  }

  // Ganti handler tombol simpan agar tidak terpasang berulang
  if (tombolSimpan._editHandler) {
    tombolSimpan.removeEventListener("click", tombolSimpan._editHandler);
  }

  const simpanEdit = async function() {
    const teksBaru = textarea.value.trim();

    if (!teksBaru) {
      alert("Pesan tidak boleh kosong.");
      textarea.focus();
      return;
    }

    if (teksBaru === teksLama) {
      tutupEditor();
      return;
    }

    tombolSimpan.disabled = true;
    tombolSimpan.textContent = "Menyimpan...";

    try {
      await updateDoc(
        doc(db, "rooms", roomId, "messages", messageId),
        {
          text: teksBaru,
          editedAt: serverTimestamp()
        }
      );

      tutupEditor();
    } catch (error) {
      console.error("Gagal mengedit pesan:", error);
      alert("Pesan gagal diedit: " + error.message);
      tombolSimpan.disabled = false;
      tombolSimpan.textContent = "Simpan perubahan";
    }
  };

  tombolSimpan._editHandler = simpanEdit;
  tombolSimpan.addEventListener("click", simpanEdit);

  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);
}

// PENGELOLAAN RIWAYAT CHAT
async function bersihkanRiwayatChat(roomId) {
  if (!currentUser) return;

  const yakin = confirm(
    "Bersihkan riwayat chat ini?\\n\\n" +
    "Pesan lama tidak akan tampil lagi di akun kamu.\\n" +
    "Chat tetap ada di daftar. Riwayat teman tidak terpengaruh."
  );
  if (!yakin) return;

  try {
    await setDoc(
      doc(db, "users", currentUser.uid, "hiddenChats", roomId),
      {
        roomId: roomId,
        hiddenAt: serverTimestamp(),
        deletedAt: null
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Gagal membersihkan riwayat:", error);
    alert("Riwayat gagal dibersihkan: " + error.message);
  }
}

async function hapusChatDariDaftar(roomId) {
  if (!currentUser) return;

  const yakin = confirm(
    "Hapus chat ini dari daftar kamu?\\n\\n" +
    "Riwayat lama tidak akan tampil lagi di akunmu.\\n" +
    "Chat muncul kembali saat ada pesan baru.\\n" +
    "Pertemanan dan riwayat teman tetap aman."
  );
  if (!yakin) return;

  try {
    const waktuHapus = serverTimestamp();
    await setDoc(
      doc(db, "users", currentUser.uid, "hiddenChats", roomId),
      {
        roomId: roomId,
        hiddenAt: waktuHapus,
        deletedAt: waktuHapus
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Gagal menghapus chat dari daftar:", error);
    alert("Chat gagal dihapus: " + error.message);
  }
}

// PENCARIAN CHAT
searchInput.addEventListener("input", function() {
  clearTimeout(searchTimer);
  const kataKunci = searchInput.value.trim().toLowerCase();

  if (!kataKunci) {
    cariPesanBeranda("");
    return;
  }

  searchTimer = setTimeout(function() {
    cariPesanBeranda(kataKunci);
  }, 400);
});
if (messageSearchInput) {
  messageSearchInput.addEventListener("input", terapkanPencarianPesan);
}

// BUAT RUANG CHAT
async function createPrivateRoom() {
  if (!currentUser) return;

  try {
    const roomRef = await addDoc(collection(db, "rooms"), {
      type: "private",
      members: [currentUser.uid],
      createdBy: currentUser.uid,
      createdAt: serverTimestamp()
    });

    const roomId = roomRef.id;

    alert(
      "Ruang berhasil dibuat!\n\n" +
      "Kode undangan:\n" + roomId +
      "\n\nBagikan kode ini kepada teman kamu."
    );

    openRoom(roomId);

  } catch (error) {
    console.error(error);
    alert("Gagal membuat ruang: " + error.message);
  }
}

// GABUNG DENGAN KODE UNDANGAN
async function joinPrivateRoom() {
  if (!currentUser) return;

  const code = prompt("Masukkan kode undangan DateChat:");

  if (!code) return;

  const roomId = code.trim();

  try {
    const roomRef = doc(db, "rooms", roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      alert("Kode undangan tidak ditemukan.");
      return;
    }

    const room = roomSnap.data();

    if (room.type !== "private" || !Array.isArray(room.members)) {
      alert("Ruang chat tidak valid.");
      return;
    }

    if (room.members.includes(currentUser.uid)) {
      openRoom(roomId);
      return;
    }

    if (room.members.length !== 1) {
      alert("Ruang sudah penuh atau tidak tersedia.");
      return;
    }

    await updateDoc(roomRef, {
      members: arrayUnion(currentUser.uid)
    });

    alert("Berhasil bergabung ke ruang chat!");

    openRoom(roomId);

  } catch (error) {
    console.error(error);
    alert("Gagal bergabung: " + error.message);
  }
}

// PANEL NOTIFIKASI
const notificationsPanel = document.getElementById("notificationsPanel");
const closeNotificationsButton = document.getElementById("closeNotifications");

closeNotificationsButton.addEventListener("click", function() {
  bukaBagianBeranda("chats");
});

// MENU CHAT BARU
const newChatPanel = document.getElementById("newChatPanel");

const friendsPanel = document.getElementById("friendsPanel");

function bukaBagianBeranda(bagian) {
  const panel = {
    friends: friendsPanel,
    notifications: notificationsPanel,
    settings: settingsPanel,
    profile: profilePanel,
    newChat: newChatPanel
  };

  Object.values(panel).forEach(function(item) {
    if (item) item.hidden = true;
  });

  if (bagian !== "chats" && panel[bagian]) {
    panel[bagian].hidden = false;
  }

  const daftarChat = document.querySelector(".search-section");
  const filterChat = document.querySelector(".conversation-tabs");
  const daftarPercakapan = document.querySelector(".conversation-section");

  const tampilkanChat = bagian === "chats";

  daftarChat.hidden = !tampilkanChat;
  filterChat.hidden = !tampilkanChat;
  daftarPercakapan.hidden = !tampilkanChat;

  Object.entries({
    chats: "navChats",
    friends: "navFriends",
    notifications: "navNotifications",
    settings: "navSettings"
  }).forEach(function([nama, id]) {
    document.getElementById(id).classList.toggle("active", nama === bagian);
  });
}

document.getElementById("navChats").addEventListener("click", function() {
  bukaBagianBeranda("chats");
});

document.getElementById("navFriends").addEventListener("click", function() {
  bukaBagianBeranda("friends");
});

document.getElementById("navNotifications").addEventListener("click", function() {
  bukaBagianBeranda("notifications");
});

document.getElementById("navSettings").addEventListener("click", function() {
  bukaBagianBeranda("settings");
});

document.getElementById("closeFriends").addEventListener("click", function() {
  bukaBagianBeranda("chats");
});


document.getElementById("openPrivateChat")
  .addEventListener("click", function() {
    newChatPanel.hidden = false;
  });

document.getElementById("closeNewChat")
  .addEventListener("click", function() {
    newChatPanel.hidden = true;
  });

// CARI TEMAN DENGAN USERNAME
document.getElementById("findByUsername")
  .addEventListener("click", async function() {
    const input = document.getElementById("friendUsernameInput");
    const hasil = document.getElementById("friendSearchResult");
    const username = input.value.trim().replace(/^@/, "").toLowerCase();
    const tombol = this;

    hasil.textContent = "";

    if (!username) {
      hasil.textContent = "Masukkan username teman.";
      return;
    }

    if (!/^[a-z0-9_]{4,20}$/.test(username)) {
      hasil.textContent =
        "Username harus 4-20 karakter, huruf kecil, angka, atau garis bawah.";
      return;
    }

    tombol.disabled = true;
    hasil.textContent = "Sedang mencari pengguna...";

    try {
      const usernameRef = doc(db, "usernames", username);
      const usernameSnap = await getDoc(usernameRef);

      if (!usernameSnap.exists()) {
        hasil.textContent = "Username tidak ditemukan.";
        return;
      }

      const pemilik = usernameSnap.data();

      if (
        !pemilik.uid ||
        pemilik.username !== username ||
        pemilik.uid === currentUser.uid
      ) {
        hasil.textContent = pemilik.uid === currentUser.uid
          ? "Itu adalah username akun kamu sendiri."
          : "Data username tidak valid.";
        return;
      }

      const profilRef = doc(db, "publicProfiles", pemilik.uid);
      const profilSnap = await getDoc(profilRef);

      if (!profilSnap.exists()) {
        hasil.textContent = "Profil pengguna tidak ditemukan.";
        return;
      }

      const data = profilSnap.data();

      if (
        data.uid !== pemilik.uid ||
        data.username !== username
      ) {
        hasil.textContent = "Data profil tidak cocok.";
        return;
      }

      hasil.textContent = "";

      const kartu = document.createElement("div");
      kartu.className = "friend-search-card";

      if (data.photoURL) {
        const foto = document.createElement("img");
        foto.src = data.photoURL;
        foto.alt = "Foto profil";
        foto.className = "friend-search-avatar";
        kartu.appendChild(foto);
      }

      const informasi = document.createElement("div");

      const nama = document.createElement("strong");
      nama.textContent = data.displayName || "Pengguna DateChat";

      const id = document.createElement("p");
      id.textContent = "@" + username;

      informasi.append(nama, id);
      kartu.appendChild(informasi);

      const uidTeman = pemilik.uid;
      const uidSaya = currentUser.uid;
      const idPermintaan = uidSaya + "_" + uidTeman;
      const [daftarTeman, permintaanKeluar, permintaanMasuk] =
        await Promise.all([
          getDocs(query(
            collection(db, "friendships"),
            where("members", "array-contains", uidSaya)
          )),
          getDocs(query(
            collection(db, "friendRequests"),
            where("senderId", "==", uidSaya)
          )),
          getDocs(query(
            collection(db, "friendRequests"),
            where("recipientId", "==", uidSaya)
          ))
        ]);

      const sudahTeman = daftarTeman.docs.some(function(item) {
        return item.data().members.includes(uidTeman);
      });

      const keluar = permintaanKeluar.docs.find(function(item) {
        return item.data().recipientId === uidTeman;
      });

      const masuk = permintaanMasuk.docs.find(function(item) {
        return item.data().senderId === uidTeman;
      });

      const tombolTeman = document.createElement("button");
      tombolTeman.type = "button";

      if (sudahTeman) {
        tombolTeman.textContent = "Sudah berteman";
        tombolTeman.disabled = true;
      } else if (keluar && keluar.data().status === "pending") {
        tombolTeman.textContent = "Permintaan terkirim";
        tombolTeman.disabled = true;
      } else if (masuk && masuk.data().status === "pending") {
        tombolTeman.textContent = "Ada permintaan masuk";
        tombolTeman.disabled = true;
      } else if (
        (keluar && keluar.data().status === "rejected") ||
        (masuk && masuk.data().status === "rejected")
      ) {
        tombolTeman.textContent = "Permintaan sebelumnya ditolak";
        tombolTeman.disabled = true;
      } else {
        tombolTeman.classList.add("add-friend-button");
        tombolTeman.innerHTML = `
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="10" cy="7" r="4"></circle>
            <line x1="19" y1="8" x2="19" y2="14"></line>
            <line x1="22" y1="11" x2="16" y2="11"></line>
          </svg>
          <span>Tambah Teman</span>
        `;

        tombolTeman.addEventListener("click", async function() {
          tombolTeman.disabled = true;
          tombolTeman.textContent = "Mengirim...";

          try {
            await setDoc(doc(db, "friendRequests", idPermintaan), {
              senderId: uidSaya,
              recipientId: uidTeman,
              status: "pending",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            tombolTeman.textContent = "Permintaan terkirim";
          } catch (error) {
            console.error("Gagal mengirim permintaan:", error);
            tombolTeman.textContent = "Tambah Teman";
            tombolTeman.disabled = false;
            alert("Gagal mengirim permintaan: " + error.message);
          }
        });
      }

      kartu.appendChild(tombolTeman);

      hasil.appendChild(kartu);

    } catch (error) {
      console.error("Pencarian username gagal:", error);
      hasil.textContent = "Gagal mencari pengguna. Coba lagi.";
    } finally {
      tombol.disabled = false;
    }
  });

// KODE UNDANGAN
document.getElementById("openInviteCode")
  .addEventListener("click", function() {
    newChatPanel.hidden = true;

    const pilihan = prompt(
      "KODE UNDANGAN\\n\\n" +
      "1. Buat kode undangan\\n" +
      "2. Masukkan kode teman\\n\\n" +
      "Masukkan angka 1 atau 2:"
    );

    if (pilihan === "1") {
      createPrivateRoom();
    } else if (pilihan === "2") {
      joinPrivateRoom();
    }
  });

// STATUS PESAN DITERIMA
function tandaiPesanDiterima(roomId, messageId, data) {
  if (!currentUser || data.senderId === currentUser.uid) return;

  const delivered = Array.isArray(data.deliveredTo)
    ? data.deliveredTo : [];

  if (delivered.includes(currentUser.uid)) return;

  updateDoc(
    doc(db, "rooms", roomId, "messages", messageId),
    { deliveredTo: arrayUnion(currentUser.uid) }
  ).catch(function(error) {
    console.error("Gagal memperbarui status diterima:", error);
  });
}

// STATUS PESAN DIBACA
function tandaiPesanDibaca(roomId, messageId, data) {
  if (!currentUser || data.senderId === currentUser.uid) return;

  const delivered = Array.isArray(data.deliveredTo)
    ? data.deliveredTo : [];
  const read = Array.isArray(data.readBy)
    ? data.readBy : [];

  if (
    delivered.includes(currentUser.uid) &&
    read.includes(currentUser.uid)
  ) return;

  updateDoc(
    doc(db, "rooms", roomId, "messages", messageId),
    {
      deliveredTo: arrayUnion(currentUser.uid),
      readBy: arrayUnion(currentUser.uid)
    }
  ).catch(function(error) {
    console.error("Gagal memperbarui status dibaca:", error);
  });
}

// FITUR BALAS PESAN
function pilihPesanUntukDibalas(messageId, data) {
  selectedReply = {
    messageId: messageId,
    senderId: data.senderId,
    text: data.text || (
      data.mediaType === "image" ? "Foto" :
      data.mediaType === "video" ? "Video" : ""
    )
  };

  replyPreviewName.textContent =
    data.senderId === currentUser.uid ? "Membalas pesan Anda" : "Membalas pesan";

  replyPreviewText.textContent = selectedReply.text || "(pesan kosong)";
  replyPreview.hidden = false;
  chatInput.focus();
}

function batalBalasPesan() {
  selectedReply = null;
  replyPreview.hidden = true;
  replyPreviewText.textContent = "";
}

cancelReply.addEventListener("click", batalBalasPesan);

// SEMBUNYIKAN PESAN UNTUK AKUN SENDIRI
async function sembunyikanPesanUntukSaya(roomId, messageId, perluKonfirmasi = true) {
  if (!currentUser) return;
  if (perluKonfirmasi) {
    const yakin = confirm(
      "Hapus pesan ini dari tampilan akun kamu? Pesan asli tetap terlihat oleh lawan chat."
    );
    if (!yakin) return;
  }

  const hiddenId = roomId + "_" + messageId;

  try {
    await setDoc(
      doc(db, "users", currentUser.uid, "hiddenMessages", hiddenId),
      {
        roomId: roomId,
        messageId: messageId,
        hiddenAt: serverTimestamp()
      }
    );
  } catch (error) {
    console.error("Gagal menyembunyikan pesan:", error);
    alert("Gagal menyembunyikan pesan: " + error.message);
  }
}

// BUKA RUANG CHAT
function openRoom(roomId) {
  partnerProfilePanel.hidden = true;
  if (stopMessages) stopMessages();
  if (stopHiddenMessages) stopHiddenMessages();
  stopHiddenMessages = null;
  hiddenMessageIds.clear();

  if (stopPartnerProfile) {
    stopPartnerProfile();
    stopPartnerProfile = null;
  }

  if (stopPartnerPresence) {
    stopPartnerPresence();
    stopPartnerPresence = null;
  }

  const partnerOnlineStatus = document.getElementById("partnerOnlineStatus");
  if (partnerOnlineStatus) partnerOnlineStatus.hidden = true;

  const stateSaatIni = history.state || {};

  if (stateSaatIni.dateChatRoom) {
    history.replaceState(
      { ...stateSaatIni, dateChatRoom: roomId },
      "",
      location.href
    );
  } else {
    history.pushState(
      { ...stateSaatIni, dateChatRoom: roomId },
      "",
      location.href
    );
  }

  currentRoomId = roomId;
  currentPartnerProfile = {
    displayName: "",
    photoURL: "",
    username: ""
  };
  searchMessageMatches.delete(roomId);
  if (messageSearchInput) messageSearchInput.value = "";
  showScreen("chat");

  const partnerNameElement = document.getElementById("partnerName");
  const partnerAvatarElement = document.getElementById("partnerAvatar");

  partnerNameElement.textContent = "Memuat profil...";
  tampilkanAvatar(partnerAvatarElement, "");

  const ruangProfil = roomsCache.find(function(room) {
    return room.id === roomId;
  });

  const partnerUid = ruangProfil && Array.isArray(ruangProfil.members)
    ? ruangProfil.members.find(function(uid) {
        return uid !== currentUser.uid;
      })
    : null;

  if (partnerUid) {
    if (partnerOnlineStatus) {
      stopPartnerPresence = onValue(
        ref(rtdb, "presence/" + partnerUid + "/online"),
        function(snapshot) {
          if (currentRoomId !== roomId) return;
          partnerOnlineStatus.hidden = snapshot.val() !== true;
        },
        function(error) {
          console.warn("Status online teman tidak dapat dibaca:", error);
          partnerOnlineStatus.hidden = true;
        }
      );
    }

    stopPartnerProfile = onSnapshot(
      doc(db, "publicProfiles", partnerUid),
      function(snapshot) {
        if (!snapshot.exists()) {
          currentPartnerProfile = {
            displayName: "",
            photoURL: "",
            username: ""
          };
          partnerNameElement.textContent = "Pengguna DateChat";
          tampilkanAvatar(partnerAvatarElement, "");
          return;
        }

        const dataProfilTeman = snapshot.data();

        currentPartnerProfile = {
          displayName: dataProfilTeman.displayName || "",
          photoURL: dataProfilTeman.photoURL || "",
          username: dataProfilTeman.username || ""
        };

        partnerNameElement.textContent =
          dataProfilTeman.displayName || "Pengguna DateChat";

        tampilkanAvatar(
          partnerAvatarElement,
          dataProfilTeman.photoURL || ""
        );
      },
      function(error) {
        console.error("Gagal memuat profil teman:", error);
        currentPartnerProfile = {
          displayName: "",
          photoURL: "",
          username: ""
        };
        partnerNameElement.textContent = "Pengguna DateChat";
      }
    );
  } else {
    partnerNameElement.textContent = "Menunggu teman bergabung";
  }

  messages.innerHTML = "";

  if (!hiddenChatsLoaded) {
    messages.textContent = "Memuat riwayat chat...";
    return;
  }

  // MEMUAT PESAN YANG DISEMBUNYIKAN AKUN INI
  const hiddenQuery = query(
    collection(db, "users", currentUser.uid, "hiddenMessages"),
    where("roomId", "==", roomId)
  );

  stopHiddenMessages = onSnapshot(
    hiddenQuery,
    function(snapshot) {
      hiddenMessageIds = new Set(
        snapshot.docs.map(function(item) {
          return item.data().messageId;
        })
      );

      messages.querySelectorAll(".message-bubble[data-message-id]")
        .forEach(function(bubble) {
          if (hiddenMessageIds.has(bubble.dataset.messageId)) {
            bubble.remove();
          }
        });
    },
    function(error) {
      console.error("Gagal memuat pesan tersembunyi:", error);
      alert("Gagal memuat pesan tersembunyi: " + error.message);
    }
  );

  const pesanQuery = query(
    collection(db, "rooms", roomId, "messages"),
    orderBy("createdAt", "asc")
  );

  stopMessages = onSnapshot(
    pesanQuery,
    function(snapshot) {
      searchMessageMatches.delete(roomId);
      messages.innerHTML = "";

      if (snapshot.empty) {
        const welcome = document.createElement("div");
        welcome.className = "system-message";
        welcome.textContent = "Mulai percakapan di DateChat ❤️";
        messages.appendChild(welcome);
      }

      snapshot.forEach(function(item) {
        const data = item.data();

        // Filter riwayat lama khusus akun ini
        const statusChat = hiddenChats.get(roomId) || {};
        const waktuDisembunyikan = statusChat.hiddenAt;
        if (waktuDisembunyikan) {
          const batasWaktu = waktuDisembunyikan.toMillis
            ? waktuDisembunyikan.toMillis() : 0;
          const waktuPesan = data.createdAt?.toMillis?.() || 0;
          if (waktuPesan <= batasWaktu) return;
        }

        // Tandai pesan dari lawan chat sebagai sudah dibaca
        tandaiPesanDibaca(roomId, item.id, data);

        // Lewati pesan yang disembunyikan akun ini
        if (hiddenMessageIds.has(item.id)) return;

        const milikSaya = data.senderId === currentUser.uid;

        const bubble = document.createElement("div");
        bubble.className =
          "message-bubble " +
          (milikSaya ? "sent" : "received");

        bubble.dataset.messageId = item.id;

        const tombolMenuPesan = document.createElement("button");
        tombolMenuPesan.type = "button";
        tombolMenuPesan.className = "message-delete-button";
        tombolMenuPesan.textContent = "⋯";
        tombolMenuPesan.title = "Hapus untuk saya";
        tombolMenuPesan.setAttribute("aria-label", "Hapus untuk saya");

        tombolMenuPesan.addEventListener("click", function(event) {
          event.stopPropagation();
          sembunyikanPesanUntukSaya(roomId, item.id);
        });

        bubble.appendChild(tombolMenuPesan);

if (data.text && data.text.trim()) {
  const tombolSalin = document.createElement("button");
  tombolSalin.type = "button";
  tombolSalin.className = "message-copy-button";
  tombolSalin.textContent = "Salin";
  tombolSalin.title = "Salin pesan";

  tombolSalin.addEventListener("click", async function(event) {
    event.stopPropagation();

    try {
      try {
        await navigator.clipboard.writeText(data.text);
      } catch (error) {
        const areaSalin = document.createElement("textarea");
        areaSalin.value = data.text;
        areaSalin.style.position = "fixed";
        areaSalin.style.opacity = "0";
        document.body.appendChild(areaSalin);
        areaSalin.select();

        const berhasil = document.execCommand("copy");
        areaSalin.remove();

        if (!berhasil) {
          throw new Error("Clipboard tidak tersedia.");
        }
      }

      const infoSalin = document.createElement("div");
      infoSalin.className = "system-message";
      infoSalin.textContent = "Pesan berhasil disalin.";
      messages.appendChild(infoSalin);

      setTimeout(function() {
        infoSalin.remove();
      }, 1800);

      bubble.classList.remove("message-actions-visible");
    } catch (error) {
      alert("Gagal menyalin pesan. Silakan coba lagi.");
    }
  });

  bubble.appendChild(tombolSalin);
}


        if (milikSaya && data.text && !data.mediaUrl) {
          const tombolEdit = document.createElement("button");
          tombolEdit.type = "button";
          tombolEdit.className = "message-edit-button";
          tombolEdit.textContent = "Edit";
          tombolEdit.title = "Edit pesan";
          tombolEdit.addEventListener("click", function(event) {
            event.stopPropagation();
            editMessage(roomId, item.id, data.text);
          });
          bubble.appendChild(tombolEdit);
        }

        // PILIH PESAN DENGAN TEKAN LAMA ATAU SENTUH
        let timerTekanPesan = null;
        let tekanLamaAktif = false;

        bubble.addEventListener("pointerdown", function(event) {
          if (event.pointerType === "mouse" && event.button !== 0) return;

          tekanLamaAktif = false;

          timerTekanPesan = setTimeout(function() {
            tekanLamaAktif = true;
            pilihPesanAksi(roomId, item.id, data, bubble, milikSaya);
          }, 500);
        });

        ["pointerup", "pointerleave", "pointercancel"].forEach(function(jenisEvent) {
          bubble.addEventListener(jenisEvent, function() {
            clearTimeout(timerTekanPesan);
          });
        });

        bubble.addEventListener("contextmenu", function(event) {
          event.preventDefault();
          tekanLamaAktif = true;
          pilihPesanAksi(roomId, item.id, data, bubble, milikSaya);
        });

        bubble.addEventListener("click", function(event) {
          if (tekanLamaAktif) {
            tekanLamaAktif = false;
            event.preventDefault();
            return;
          }

          if (!event.target.closest("button")) {
            if (
              selectedMessage &&
              selectedMessage.messageId === item.id
            ) {
              batalPilihPesanAksi();
            } else {
              pilihPesanAksi(roomId, item.id, data, bubble, milikSaya);
            }
          }
        });

        if (stickerEmojis.includes(data.text)) {
          bubble.classList.add("sticker-message");
        }

        // Tampilkan kutipan pesan yang dibalas
        if (data.replyTo) {
          const kutipan = document.createElement("div");
          kutipan.className = "reply-quote";

          const namaKutipan = document.createElement("strong");
          namaKutipan.textContent =
            data.replyTo.senderId === currentUser.uid
              ? "Pesan Anda"
              : "Pesan lawan chat";

          const teksKutipan = document.createElement("span");
          teksKutipan.textContent = data.replyTo.text || "(pesan kosong)";

          kutipan.appendChild(namaKutipan);
          kutipan.appendChild(teksKutipan);
          bubble.appendChild(kutipan);
        }

        const isiPesan = document.createElement("div");
        isiPesan.className = "message-text";

        if (data.mediaUrl && data.mediaType === "image") {
          const foto = document.createElement("img");
          foto.className = "message-media-image";
          foto.src = data.mediaUrl;
          foto.alt = data.mediaName || "Foto";
          foto.loading = "lazy";
          foto.decoding = "async";
          isiPesan.appendChild(foto);
        }

        if (data.mediaUrl && data.mediaType === "video") {
          const video = document.createElement("video");
          video.className = "message-media-video";
          video.src = data.mediaUrl;
          video.controls = true;
          video.playsInline = true;
          video.preload = "metadata";
          isiPesan.appendChild(video);
        }

        if (data.text) {
          const caption = document.createElement("div");
          caption.className = data.mediaUrl ? "media-caption" : "";
          caption.textContent = data.text;
          isiPesan.appendChild(caption);
        }

        bubble.appendChild(isiPesan);

        // JAM PESAN
        const waktuPesan = document.createElement("span");
        waktuPesan.className = "message-time";
        waktuPesan.textContent = (data.editedAt ? "Diedit · " : "") + formatTime(data.createdAt);
        if (waktuPesan.textContent) {
          bubble.appendChild(waktuPesan);
        }

        // Geser pesan ke kanan untuk membalas
        let posisiAwalX = 0;
        let posisiAwalY = 0;

        bubble.addEventListener("touchstart", function(event) {
          const sentuhan = event.touches[0];
          posisiAwalX = sentuhan.clientX;
          posisiAwalY = sentuhan.clientY;
        }, { passive: true });

        bubble.addEventListener("touchend", function(event) {
          const sentuhan = event.changedTouches[0];
          const selisihX = sentuhan.clientX - posisiAwalX;
          const selisihY = sentuhan.clientY - posisiAwalY;

          if (selisihX > 65 && Math.abs(selisihX) > Math.abs(selisihY)) {
            pilihPesanUntukDibalas(item.id, data);
          }
        }, { passive: true });

        if (milikSaya) {
          const ruang = roomsCache.find(function(room) {
            return room.id === roomId;
          });

          const partnerUid = ruang && Array.isArray(ruang.members)
            ? ruang.members.find(function(uid) {
                return uid !== currentUser.uid;
              })
            : null;

          const delivered = Array.isArray(data.deliveredTo)
            ? data.deliveredTo : [];
          const read = Array.isArray(data.readBy)
            ? data.readBy : [];

          const status = document.createElement("span");
          status.className = "message-status";

          if (partnerUid && read.includes(partnerUid)) {
            status.textContent = "✓✓";
            status.classList.add("read");
          } else if (partnerUid && delivered.includes(partnerUid)) {
            status.textContent = "✓✓";
          } else {
            status.textContent = "✓";
          }

          bubble.appendChild(status);
        }

        messages.appendChild(bubble);
      });

      messages.scrollTop = messages.scrollHeight;
      terapkanPencarianPesan();
    },
    function(error) {
      console.error("Gagal memuat pesan:", error);
      alert("Gagal memuat pesan: " + error.message);
    }
  );
}

// KIRIM PESAN
chatForm.addEventListener("submit", async function(event) {
  event.preventDefault();

  const text = chatInput.value.trim();

  if (!text || !currentUser || !currentRoomId) return;

  const roomIdTujuan = currentRoomId;
  const uidPengirim = currentUser.uid;
  const balasanAktif = selectedReply;

  const pesanBaru = {
    senderId: uidPengirim,
    text: text,
    createdAt: serverTimestamp(),
    deliveredTo: [],
    readBy: []
  };

  if (balasanAktif) {
    pesanBaru.replyTo = {
      messageId: balasanAktif.messageId,
      senderId: balasanAktif.senderId,
      text: balasanAktif.text
    };
  }

  try {
    const bolehKirim = await bolehMengirimKeRoom(
      roomIdTujuan,
      uidPengirim
    );

    if (!bolehKirim) {
      alert("Kalian sudah tidak berteman. Kirim permintaan teman baru untuk mengirim pesan lagi.");
      return;
    }

    if (!currentUser || currentUser.uid !== uidPengirim ||
        currentRoomId !== roomIdTujuan) {
      throw new Error("Ruang chat berubah. Silakan kirim ulang pesan.");
    }

    await addDoc(
      collection(db, "rooms", roomIdTujuan, "messages"),
      pesanBaru
    );

    if (currentUser && currentUser.uid === uidPengirim &&
        currentRoomId === roomIdTujuan) {
      chatInput.value = "";
      chatInput.style.height = "44px";
      suggestionPanel.hidden = true;

      if (selectedReply === balasanAktif) {
        batalBalasPesan();
      }
    }

  } catch (error) {
    console.error(error);
    alert("Pesan gagal dikirim: " + error.message);
  }
});

// MENU LAMPIRAN
mediaToggle.addEventListener("click", function() {
  const akanDibuka = mediaPanel.hidden;
  tutupPicker();
  mediaPanel.hidden = !akanDibuka;
});

document.getElementById("cameraToggle").addEventListener("click", function() {
  bukaKameraDateChat("photo");
});

document.getElementById("attachGallery").addEventListener("click", function() {
  mediaPanel.hidden = true;
  document.getElementById("photoInput").click();
});

document.getElementById("attachLink").addEventListener("click", function() {
  mediaPanel.hidden = true;

  if (!currentUser || !currentRoomId) {
    alert("Buka percakapan terlebih dahulu.");
    return;
  }

  const alamat = prompt("Masukkan tautan yang ingin dikirim:");
  if (!alamat || !alamat.trim()) return;

  let url;
  try {
    const teks = alamat.trim();
    url = new URL(/^https?:\/\//i.test(teks) ? teks : "https://" + teks);

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Protokol tidak didukung");
    }
  } catch (error) {
    alert("Tautan tidak valid. Masukkan alamat website yang benar.");
    return;
  }

  chatInput.value = url.href;
  chatForm.requestSubmit();
});

// KOLOM PESAN OTOMATIS MEMANJANG
chatInput.addEventListener("input", function() {
  this.style.height = "auto";
  this.style.height = Math.min(this.scrollHeight, 120) + "px";
});

// ENTER UNTUK KIRIM, SHIFT + ENTER UNTUK BARIS BARU
chatInput.addEventListener("keydown", function(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

// EMOJI DAN STICKER DATECHAT
function tutupPicker() {
  pickerPanel.hidden = true;
  suggestionPanel.hidden = true;
}

function bukaPicker(jenis) {
  suggestionPanel.hidden = true;

  if (!pickerPanel.hidden) {
    pickerPanel.hidden = true;
    return;
  }

  pickerPanel.innerHTML = "";
  pickerPanel.hidden = false;

  const daftar = jenis === "emoji" ? emojiList : stickerEmojis;

  daftar.forEach(function(simbol) {
    const tombol = document.createElement("button");
    tombol.type = "button";
    tombol.textContent = simbol;
    tombol.setAttribute("aria-label", simbol);

    tombol.addEventListener("click", async function() {
      if (jenis === "emoji") {
        chatInput.value += simbol;
        chatInput.focus();
        chatInput.dispatchEvent(new Event("input"));
      } else {
        await kirimSticker(simbol);
      }
    });

    pickerPanel.appendChild(tombol);
  });
}

async function kirimSticker(simbol) {
  if (!currentUser || !currentRoomId) return;

  const roomIdTujuan = currentRoomId;
  const uidPengirim = currentUser.uid;

  try {
    const bolehKirim = await bolehMengirimKeRoom(
      roomIdTujuan,
      uidPengirim
    );

    if (!bolehKirim) {
      alert("Kalian sudah tidak berteman. Kirim permintaan teman baru untuk mengirim sticker lagi.");
      return;
    }

    if (!currentUser || currentUser.uid !== uidPengirim ||
        currentRoomId !== roomIdTujuan) {
      throw new Error("Ruang chat berubah. Silakan kirim ulang sticker.");
    }

    await addDoc(
      collection(db, "rooms", roomIdTujuan, "messages"),
      {
        senderId: uidPengirim,
        text: simbol,
        createdAt: serverTimestamp()
      }
    );

    if (currentUser && currentUser.uid === uidPengirim &&
        currentRoomId === roomIdTujuan) {
      tutupPicker();
    }

  } catch (error) {
    console.error("Gagal mengirim sticker:", error);
    alert("Sticker gagal dikirim: " + error.message);
  }
}

stickerToggle.addEventListener("click", function() {
  bukaPicker("sticker");
});

// REKOMENDASI STICKER SAAT MENGETIK
chatInput.addEventListener("input", function() {
  const kata = chatInput.value.toLowerCase().trim();
  suggestionPanel.innerHTML = "";

  if (!kata) {
    suggestionPanel.hidden = true;
    return;
  }

  const cocok = stickerSuggestions.filter(function(item) {
    return item.words.some(function(word) {
      return kata.includes(word);
    });
  });

  if (cocok.length === 0) {
    suggestionPanel.hidden = true;
    return;
  }

  suggestionPanel.hidden = false;
  pickerPanel.hidden = true;

  cocok.forEach(function(item) {
    const tombol = document.createElement("button");
    tombol.type = "button";
    tombol.textContent = item.emoji;
    tombol.title = "Kirim sticker";

    tombol.addEventListener("click", function() {
      kirimSticker(item.emoji);
    });

    suggestionPanel.appendChild(tombol);
  });
});

// KEMBALI KE DAFTAR CHAT
function kembaliKeDaftarChat() {
  partnerProfilePanel.hidden = true;

  if (stopMessages) stopMessages();
  if (stopHiddenMessages) stopHiddenMessages();
  if (stopPartnerProfile) stopPartnerProfile();
  if (stopPartnerPresence) stopPartnerPresence();

  const statusOnlineHeader = document.getElementById("partnerOnlineStatus");
  if (statusOnlineHeader) statusOnlineHeader.hidden = true;

  stopMessages = null;
  stopHiddenMessages = null;
  hiddenMessageIds.clear();
  stopPartnerProfile = null;
  stopPartnerPresence = null;
  currentRoomId = null;

  showScreen("home");
}

document.getElementById("backHome")
  .addEventListener("click", function() {
    if (history.state && history.state.dateChatRoom) {
      history.back();
    } else {
      kembaliKeDaftarChat();
    }
  });

window.addEventListener("popstate", function() {
  if (currentRoomId) {
    kembaliKeDaftarChat();
  }
});

// KELUAR
async function logout() {
  try {
    partnerProfilePanel.hidden = true;
    if (stopMessages) stopMessages();
    if (stopHiddenMessages) stopHiddenMessages();
    if (stopPartnerProfile) stopPartnerProfile();
    if (stopPartnerPresence) stopPartnerPresence();
    if (stopRooms) stopRooms();

    const statusOnlineHeader = document.getElementById("partnerOnlineStatus");
    if (statusOnlineHeader) statusOnlineHeader.hidden = true;

    stopMessages = null;
    stopHiddenMessages = null;
    hiddenMessageIds.clear();
    stopPartnerProfile = null;
    stopPartnerPresence = null;
    stopRooms = null;

    clearLatestListeners();

    await akhiriPresenceSendiri();
    await signOut(auth);
  } catch (error) {
    alert("Gagal keluar: " + error.message);
  }
}

const logoutButton = document.getElementById("logoutButton");
if (logoutButton) {
  logoutButton.addEventListener("click", logout);
}

document.getElementById("logoutHome")
  .addEventListener("click", logout);

document.getElementById("logoutAllButton")
  .addEventListener("click", logout);

// FILTER PERCAKAPAN
document.querySelectorAll(".conversation-tabs button")
  .forEach(function(button) {
    button.addEventListener("click", function() {
      document.querySelectorAll(".conversation-tabs button")
        .forEach(function(item) {
          item.classList.remove("active");
        });

      button.classList.add("active");
      currentFilter = button.dataset.filter;

      renderConversations();
    });
  });

// UPLOAD FOTO DAN VIDEO MELALUI IMAGEKIT
const IMAGEKIT_PUBLIC_KEY = "public_L8LVQdiZUxSw81uEq1EBvF0WuFk=";
const IMAGEKIT_AUTH_URL =
  "https://datechat-media.sopojaro23.workers.dev/auth";
const IMAGEKIT_UPLOAD_URL =
  "https://upload.imagekit.io/api/v1/files/upload";

const BATAS_FOTO = 25 * 1024 * 1024;
const BATAS_VIDEO = 100 * 1024 * 1024;

async function siapkanFotoUntukUpload(file) {
  const MAX_PIXEL_FOTO = 20_000_000;

  if (!file.type.startsWith("image/")) {
    throw new Error("Format foto tidak dapat diproses browser.");
  }

  let gambar;

  try {
    gambar = await createImageBitmap(file);
  } catch (error) {
    throw new Error(
      "Foto tidak dapat dibaca browser. Coba gunakan JPG atau PNG."
    );
  }

  const totalPixel = gambar.width * gambar.height;

  if (totalPixel <= MAX_PIXEL_FOTO) {
    gambar.close();
    return file;
  }

  const skala = Math.sqrt(MAX_PIXEL_FOTO / totalPixel);
  const lebar = Math.floor(gambar.width * skala);
  const tinggi = Math.floor(gambar.height * skala);

  const canvas = document.createElement("canvas");
  canvas.width = lebar;
  canvas.height = tinggi;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, lebar, tinggi);
  ctx.drawImage(gambar, 0, 0, lebar, tinggi);
  gambar.close();

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.90);
  });

  if (!blob) {
    throw new Error("Gagal memperkecil resolusi foto.");
  }

  const namaBaru = file.name.replace(/\.[^.]+$/, "") + ".jpg";

  return new File([blob], namaBaru, {
    type: "image/jpeg",
    lastModified: Date.now()
  });
}

async function uploadMediaDateChat(file, mediaType) {
  const user = currentUser;
  const roomId = currentRoomId;
  const balasanAktif = selectedReply;

  if (!user || !roomId) {
    throw new Error("Buka percakapan terlebih dahulu.");
  }

  const bolehKirim = await bolehMengirimKeRoom(roomId, user.uid);

  if (!bolehKirim) {
    throw new Error("Kalian sudah tidak berteman. Kirim permintaan teman baru untuk mengirim media lagi.");
  }

  if (!currentUser || currentUser.uid !== user.uid ||
      currentRoomId !== roomId) {
    throw new Error("Ruang chat berubah. Silakan coba kembali.");
  }

  const fileUpload =
    mediaType === "image"
      ? await siapkanFotoUntukUpload(file)
      : file;

  const idToken = await user.getIdToken();

  const authResponse = await fetch(IMAGEKIT_AUTH_URL, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + idToken,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  });

  const authData = await authResponse.json();

  if (!authResponse.ok) {
    throw new Error(authData.error || "Gagal meminta izin upload.");
  }

  const formData = new FormData();
  formData.append("file", fileUpload);
  formData.append(
    "fileName",
    user.uid + "_" + Date.now() + "_" + fileUpload.name
  );
  formData.append("publicKey", IMAGEKIT_PUBLIC_KEY);
  formData.append("token", authData.token);
  formData.append("expire", String(authData.expire));
  formData.append("signature", authData.signature);
  formData.append("folder", "/Home/DateChat/chat-media");
  formData.append("useUniqueFileName", "true");

  const uploadResponse = await fetch(IMAGEKIT_UPLOAD_URL, {
    method: "POST",
    body: formData
  });

  const uploadData = await uploadResponse.json();

  if (!uploadResponse.ok || !uploadData.url) {
    throw new Error(
      uploadData.message || uploadData.help || "Upload ke ImageKit gagal."
    );
  }

  if (!currentUser || currentUser.uid !== user.uid) {
    throw new Error("Sesi login berubah. Silakan coba kembali.");
  }

  if (currentRoomId !== roomId) {
    throw new Error("Ruang chat berubah. Media tidak dikirim.");
  }

  const masihBerteman = await bolehMengirimKeRoom(roomId, user.uid);

  if (!masihBerteman) {
    throw new Error("Pertemanan sudah dihapus. Media tidak dapat dikirim.");
  }

  if (!currentUser || currentUser.uid !== user.uid ||
      currentRoomId !== roomId) {
    throw new Error("Sesi atau ruang chat berubah. Silakan coba kembali.");
  }

  const pesanMedia = {
    senderId: user.uid,
    text: "",
    mediaType: mediaType,
    mediaUrl: uploadData.url,
    mediaFileId: uploadData.fileId || "",
    mediaName: fileUpload.name,
    mediaMimeType: fileUpload.type || "",
    mediaSize: fileUpload.size,
    createdAt: serverTimestamp(),
    deliveredTo: [],
    readBy: []
  };

  if (balasanAktif) {
    pesanMedia.replyTo = {
      messageId: balasanAktif.messageId,
      senderId: balasanAktif.senderId,
      text: balasanAktif.text
    };
  }

  await addDoc(
    collection(db, "rooms", roomId, "messages"),
    pesanMedia
  );

  if (selectedReply === balasanAktif && balasanAktif) {
    batalBalasPesan();
  }
}

function handleMedia(inputId, mediaType, sumber) {
  const input = document.getElementById(inputId);

  input.addEventListener("change", async function() {
    const file = this.files[0];

    if (!file) return;

    console.log("[DEBUG MEDIA]", {
      sumber,
      nama: file.name,
      tipe: file.type,
      ukuran: file.size,
      terakhirDiubah: file.lastModified
    });

    const namaFile = file.name.toLowerCase();
    const ekstensiFoto = /\.(jpg|jpeg|png|webp|heic|heif)$/i;
    const ekstensiVideo = /\.(mp4|webm|mov)$/i;

    const isFoto =
      file.type.startsWith("image/") || ekstensiFoto.test(namaFile);
    const isVideo =
      file.type.startsWith("video/") || ekstensiVideo.test(namaFile);

    if (mediaType === "image" && (!isFoto || !ekstensiFoto.test(namaFile))) {
      alert("Format foto harus JPG, PNG, WebP, HEIC, atau HEIF.");
      this.value = "";
      return;
    }

    if (mediaType === "video" && (!isVideo || !ekstensiVideo.test(namaFile))) {
      alert("Format video harus MP4, WebM, atau MOV.");
      this.value = "";
      return;
    }

    const batas = mediaType === "image" ? BATAS_FOTO : BATAS_VIDEO;

    if (file.size > batas) {
      alert(
        "Ukuran " + (mediaType === "image" ? "foto" : "video") +
        " maksimal " + (mediaType === "image" ? "25 MB" : "100 MB") + "."
      );
      this.value = "";
      return;
    }

    if (!currentUser || !currentRoomId) {
      alert("Buka percakapan terlebih dahulu.");
      this.value = "";
      return;
    }

    this.disabled = true;
    mediaPanel.hidden = true;

    const statusUpload = document.createElement("div");
    statusUpload.className = "system-message";
    statusUpload.textContent =
      "Sedang mengunggah " +
      (mediaType === "image" ? "foto" : "video") + "...";
    messages.appendChild(statusUpload);
    messages.scrollTop = messages.scrollHeight;

    try {
      await uploadMediaDateChat(file, mediaType);
    } catch (error) {
      console.error("Upload media gagal:", error);
      alert("Media gagal dikirim: " + error.message);
    } finally {
      statusUpload.remove();
      this.disabled = false;
      this.value = "";
    }
  });
}

handleMedia("cameraPhotoInput", "image", "kamera");
handleMedia("cameraVideoInput", "video", "kamera");
handleMedia("photoInput", "image", "galeri");
handleMedia("videoInput", "video", "galeri");



/* KAMERA INTERNAL DATECHAT */
const dateChatCamera = document.getElementById("dateChatCamera");
const cameraLiveVideo = document.getElementById("cameraLiveVideo");
const cameraPreviewImage = document.getElementById("cameraPreviewImage");
const cameraPreviewVideo = document.getElementById("cameraPreviewVideo");
const cameraCanvas = document.getElementById("cameraCanvas");
const cameraCapture = document.getElementById("cameraCapture");
const cameraPreviewActions = document.getElementById("cameraPreviewActions");
const cameraRecordStatus = document.getElementById("cameraRecordStatus");

let dateChatCameraStream = null;
let dateChatCameraFacing = "environment";
let dateChatCameraMode = "photo";
let dateChatCameraFile = null;
let dateChatRecorder = null;
let dateChatRecordedChunks = [];
let dateChatCameraObjectURL = null;
let dateChatDiscardRecording = false;

function hentikanStreamKameraDateChat() {
  if (dateChatCameraStream) {
    dateChatCameraStream.getTracks().forEach(track => track.stop());
    dateChatCameraStream = null;
  }
  cameraLiveVideo.srcObject = null;
}

function hapusPreviewKameraDateChat() {
  if (dateChatCameraObjectURL) {
    URL.revokeObjectURL(dateChatCameraObjectURL);
    dateChatCameraObjectURL = null;
  }

  dateChatCameraFile = null;
  cameraPreviewImage.hidden = true;
  cameraPreviewVideo.hidden = true;
  cameraLiveVideo.hidden = false;
  cameraPreviewImage.removeAttribute("src");
  cameraPreviewVideo.removeAttribute("src");
  cameraPreviewActions.hidden = true;
  cameraCapture.hidden = false;
  document.getElementById("cameraGalleryButton").hidden = false;
  document.querySelector(".datechat-camera-modes").hidden = false;
  document.getElementById("cameraSwitch").hidden = false;
  cameraCapture.classList.remove("recording");
}

async function mulaiStreamKameraDateChat() {
  hentikanStreamKameraDateChat();

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("Kamera tidak didukung browser ini. Gunakan Chrome melalui HTTPS atau localhost.");
  }

  let streamSementara = null;

  try {
    // Buka kamera sesuai arah yang diminta untuk memperoleh izin.
    // Label kamera biasanya baru tersedia setelah izin diberikan.
    const audioAktif = dateChatCameraMode === "video";

    streamSementara = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: dateChatCameraFacing } },
      audio: audioAktif
    });

    // Setelah izin tersedia, baca ulang daftar kamera.
    if (dateChatCameraFacing === "environment") {
      const daftarKamera = await navigator.mediaDevices.enumerateDevices();

      const kameraBelakang = daftarKamera.filter(function(device) {
        return device.kind === "videoinput" &&
          /belakang|back|environment|camera|kamera/i.test(device.label);
      });

      const pilihanLensa = kameraBelakang.find(function(device) {
        return /camera 2|kamera 2/i.test(device.label);
      });

      if (pilihanLensa) {
        const trackAwal = streamSementara.getVideoTracks()[0];
        const pengaturanAwal = trackAwal && trackAwal.getSettings
          ? trackAwal.getSettings()
          : {};

        // Hanya buka ulang jika kamera awal bukan Camera 2.
        if (pengaturanAwal.deviceId !== pilihanLensa.deviceId) {
          streamSementara.getTracks().forEach(function(track) {
            track.stop();
          });

          streamSementara = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: pilihanLensa.deviceId } },
            audio: audioAktif
          });
        }
      }
    }

    dateChatCameraStream = streamSementara;
    streamSementara = null;

    const cameraTrack = dateChatCameraStream.getVideoTracks()[0];

    // Terapkan zoom minimum sebelum video ditampilkan.
    if (cameraTrack && cameraTrack.getCapabilities) {
      const capabilities = cameraTrack.getCapabilities();

      if (capabilities.zoom) {
        try {
          await cameraTrack.applyConstraints({
            advanced: [{ zoom: capabilities.zoom.min }]
          });
        } catch (error) {
          console.warn("Pengaturan zoom minimum tidak didukung:", error);
        }
      }
    }

    cameraLiveVideo.srcObject = dateChatCameraStream;
    cameraLiveVideo.hidden = false;
    await cameraLiveVideo.play();

  } catch (error) {
    if (streamSementara) {
      streamSementara.getTracks().forEach(function(track) {
        track.stop();
      });
    }

    hentikanStreamKameraDateChat();
    throw error;
  }
}
async function bukaKameraDateChat(mode = "photo") {
  if (!currentUser || !currentRoomId) {
    alert("Buka percakapan terlebih dahulu.");
    return;
  }

  if (dateChatRecorder && dateChatRecorder.state === "recording") {
    return;
  }

  dateChatCameraMode = mode;
  dateChatCamera.hidden = false;
  hapusPreviewKameraDateChat();

  document.getElementById("cameraModePhoto").classList.toggle("active", mode === "photo");
  document.getElementById("cameraModeVideo").classList.toggle("active", mode === "video");
  cameraRecordStatus.textContent = mode === "photo" ? "Kamera DateChat" : "Video DateChat";

  try {
    await mulaiStreamKameraDateChat();
  } catch (error) {
    console.error("Kamera gagal dibuka:", error);
    hentikanStreamKameraDateChat();
    dateChatCamera.hidden = true;
    alert("Kamera tidak dapat dibuka: " + error.message);
  }
}

function tutupKameraDateChat() {
  dateChatDiscardRecording = true;

  if (dateChatRecorder && dateChatRecorder.state === "recording") {
    dateChatRecorder.stop();
  }

  dateChatRecorder = null;
  dateChatRecordedChunks = [];
  hentikanStreamKameraDateChat();
  hapusPreviewKameraDateChat();
  dateChatCamera.hidden = true;
  cameraRecordStatus.textContent = "Kamera DateChat";
}

function tampilkanPreviewKameraDateChat(file, mediaType) {
  hentikanStreamKameraDateChat();

  dateChatCameraFile = file;
  dateChatCameraObjectURL = URL.createObjectURL(file);

  cameraLiveVideo.hidden = true;

  if (mediaType === "image") {
    cameraPreviewImage.src = dateChatCameraObjectURL;
    cameraPreviewImage.hidden = false;
  } else {
    cameraPreviewVideo.src = dateChatCameraObjectURL;
    cameraPreviewVideo.hidden = false;
  }

  cameraCapture.hidden = true;
  document.getElementById("cameraGalleryButton").hidden = true;
  document.querySelector(".datechat-camera-modes").hidden = true;
  document.getElementById("cameraSwitch").hidden = true;
  cameraPreviewActions.hidden = false;
  cameraRecordStatus.textContent = "Pratinjau " + (mediaType === "image" ? "foto" : "video");
}

async function ambilFotoDateChat() {
  if (!cameraLiveVideo.videoWidth || !cameraLiveVideo.videoHeight) {
    alert("Kamera belum siap. Coba sebentar lagi.");
    return;
  }

  cameraCanvas.width = cameraLiveVideo.videoWidth;
  cameraCanvas.height = cameraLiveVideo.videoHeight;

  const context = cameraCanvas.getContext("2d");
  context.drawImage(cameraLiveVideo, 0, 0);

  cameraCanvas.toBlob(blob => {
    if (!blob) {
      alert("Foto gagal diambil.");
      return;
    }

    const file = new File(
      [blob],
      "datechat-foto-" + Date.now() + ".jpg",
      { type: "image/jpeg" }
    );

    tampilkanPreviewKameraDateChat(file, "image");
  }, "image/jpeg", 0.92);
}

function mulaiRekamVideoDateChat() {
  if (!dateChatCameraStream || !window.MediaRecorder) {
    alert("Perekaman video tidak didukung browser ini.");
    return;
  }

  const tipeDidukung = [
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4"
  ].find(tipe => MediaRecorder.isTypeSupported(tipe));

  if (!tipeDidukung) {
    alert("Format perekaman video tidak didukung perangkat ini.");
    return;
  }

  dateChatRecordedChunks = [];
  dateChatDiscardRecording = false;

  try {
    dateChatRecorder = new MediaRecorder(dateChatCameraStream, {
      mimeType: tipeDidukung
    });

    dateChatRecorder.ondataavailable = event => {
      if (event.data && event.data.size > 0) {
        dateChatRecordedChunks.push(event.data);
      }
    };

    dateChatRecorder.onstop = () => {
      const dibatalkan = dateChatDiscardRecording;
      const chunks = dateChatRecordedChunks;
      dateChatRecordedChunks = [];
      dateChatRecorder = null;

      hentikanStreamKameraDateChat();

      if (dibatalkan || !chunks.length) return;

      const mime = tipeDidukung.split(";")[0];
      const ekstensi = mime === "video/mp4" ? "mp4" : "webm";
      const blob = new Blob(chunks, { type: mime });

      const file = new File(
        [blob],
        "datechat-video-" + Date.now() + "." + ekstensi,
        { type: mime }
      );

      tampilkanPreviewKameraDateChat(file, "video");
    };

    dateChatRecorder.start();
    cameraCapture.classList.add("recording");
    cameraRecordStatus.textContent = "Sedang merekam...";
  } catch (error) {
    console.error(error);
    alert("Gagal memulai rekaman: " + error.message);
  }
}

cameraCapture.addEventListener("click", function() {
  if (dateChatCameraMode === "photo") {
    ambilFotoDateChat();
    return;
  }

  if (dateChatRecorder && dateChatRecorder.state === "recording") {
    dateChatRecorder.stop();
    cameraRecordStatus.textContent = "Menyiapkan video...";
    cameraCapture.classList.remove("recording");
    return;
  }

  mulaiRekamVideoDateChat();
});

document.getElementById("cameraClose").addEventListener("click", tutupKameraDateChat);

document.getElementById("cameraSwitch").addEventListener("click", async function() {
  dateChatCameraFacing = dateChatCameraFacing === "environment" ? "user" : "environment";

  try {
    await mulaiStreamKameraDateChat();
  } catch (error) {
    console.error(error);
    alert("Tidak dapat mengganti kamera: " + error.message);
  }
});

document.getElementById("cameraModePhoto").addEventListener("click", async function() {
  if (dateChatRecorder && dateChatRecorder.state === "recording") return;
  dateChatCameraMode = "photo";
  document.getElementById("cameraModePhoto").classList.add("active");
  document.getElementById("cameraModeVideo").classList.remove("active");
  cameraRecordStatus.textContent = "Kamera DateChat";

  try {
    await mulaiStreamKameraDateChat();
  } catch (error) {
    alert("Kamera gagal dibuka: " + error.message);
  }
});

document.getElementById("cameraModeVideo").addEventListener("click", async function() {
  if (dateChatRecorder && dateChatRecorder.state === "recording") return;
  dateChatCameraMode = "video";
  document.getElementById("cameraModeVideo").classList.add("active");
  document.getElementById("cameraModePhoto").classList.remove("active");
  cameraRecordStatus.textContent = "Video DateChat";

  try {
    await mulaiStreamKameraDateChat();
  } catch (error) {
    alert("Kamera gagal dibuka: " + error.message);
  }
});

document.getElementById("cameraGalleryButton").addEventListener("click", function() {
  const menu = document.getElementById("cameraGalleryMenu");
  menu.hidden = !menu.hidden;
});

document.getElementById("cameraGalleryPhoto").addEventListener("click", function() {
  document.getElementById("cameraGalleryMenu").hidden = true;
  tutupKameraDateChat();
  document.getElementById("photoInput").click();
});

document.getElementById("cameraGalleryVideo").addEventListener("click", function() {
  document.getElementById("cameraGalleryMenu").hidden = true;
  tutupKameraDateChat();
  document.getElementById("videoInput").click();
});

document.getElementById("cameraRetake").addEventListener("click", async function() {
  hapusPreviewKameraDateChat();

  try {
    await mulaiStreamKameraDateChat();
    cameraRecordStatus.textContent = dateChatCameraMode === "photo"
      ? "Kamera DateChat"
      : "Video DateChat";
  } catch (error) {
    alert("Kamera gagal dibuka: " + error.message);
  }
});

document.getElementById("cameraSend").addEventListener("click", async function() {
  const file = dateChatCameraFile;
  if (!file) return;

  const mediaType = file.type.startsWith("image/") ? "image" : "video";
  const batas = mediaType === "image" ? BATAS_FOTO : BATAS_VIDEO;

  if (file.size > batas) {
    alert("Ukuran " + (mediaType === "image" ? "foto" : "video") +
      " maksimal " + (mediaType === "image" ? "25 MB" : "100 MB") + ".");
    return;
  }

  if (!currentUser || !currentRoomId) {
    alert("Buka percakapan terlebih dahulu.");
    return;
  }

  const tombol = this;
  tombol.disabled = true;

  const statusUpload = document.createElement("div");
  statusUpload.className = "system-message";
  statusUpload.textContent = "Sedang mengunggah " +
    (mediaType === "image" ? "foto" : "video") + "...";
  messages.appendChild(statusUpload);
  messages.scrollTop = messages.scrollHeight;

  try {
    await uploadMediaDateChat(file, mediaType);
    tutupKameraDateChat();
  } catch (error) {
    console.error("Upload kamera gagal:", error);
    alert("Media gagal dikirim: " + error.message);
  } finally {
    statusUpload.remove();
    tombol.disabled = false;
  }
});

/* TEMA APLIKASI DATECHAT */
const themeSelect = document.getElementById("themeSelect");
const themeStatus = document.getElementById("themeStatus");
const THEME_STORAGE_KEY = "datechatTheme";

function applyDateChatTheme(theme) {
  const temaValid = ["navy", "amoled", "light"].includes(theme)
    ? theme
    : "navy";

  document.documentElement.dataset.theme = temaValid;
  themeSelect.value = temaValid;

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.content = temaValid === "light"
      ? "#f2f5fb"
      : temaValid === "amoled"
        ? "#000000"
        : "#080f1e";
  }
}

let savedTheme = "navy";

try {
  savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "navy";
} catch (error) {
  console.warn("Tidak dapat membaca tema tersimpan:", error);
}

applyDateChatTheme(savedTheme);

themeSelect.addEventListener("change", function() {
  const selectedTheme = this.value;
  applyDateChatTheme(selectedTheme);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
    themeStatus.textContent = "Tema berhasil disimpan di perangkat ini.";
  } catch (error) {
    themeStatus.textContent = "Tema berubah, tetapi gagal disimpan.";
    console.warn("Tidak dapat menyimpan tema:", error);
  }
});


/* PILIHAN WALLPAPER DATECHAT */
const wallpaperSelect = document.getElementById("wallpaperSelect");
const wallpaperStatus = document.getElementById("wallpaperStatus");
const WALLPAPER_STORAGE_KEY = "datechatWallpaper";

function applyDateChatWallpaper(wallpaper) {
  const validWallpaper = ["default", "minimal", "amoled"].includes(wallpaper)
    ? wallpaper
    : "default";

  document.documentElement.dataset.wallpaper = validWallpaper;
  wallpaperSelect.value = validWallpaper;
}

let savedWallpaper = "default";

try {
  savedWallpaper = localStorage.getItem(WALLPAPER_STORAGE_KEY) || "default";
} catch (error) {
  console.warn("Tidak dapat membaca wallpaper tersimpan:", error);
}

applyDateChatWallpaper(savedWallpaper);

wallpaperSelect.addEventListener("change", function() {
  const selectedWallpaper = this.value;
  applyDateChatWallpaper(selectedWallpaper);

  try {
    localStorage.setItem(WALLPAPER_STORAGE_KEY, selectedWallpaper);
    wallpaperStatus.textContent = "Wallpaper berhasil disimpan di perangkat ini.";
  } catch (error) {
    wallpaperStatus.textContent = "Wallpaper berubah, tetapi gagal disimpan.";
    console.warn("Tidak dapat menyimpan wallpaper:", error);
  }
});

/* PENGATURAN NOTIFIKASI DATECHAT */
const NOTIFICATION_SETTINGS_KEY = "datechatNotificationSettings";

const notificationControls = {
  enabled: document.getElementById("messageNotificationsEnabled"),
  sound: document.getElementById("notificationSoundEnabled"),
  vibration: document.getElementById("notificationVibrationEnabled"),
  preview: document.getElementById("notificationPreviewEnabled")
};

const notificationStatus = document.getElementById("notificationStatus");
const enableBrowserNotifications = document.getElementById("enableBrowserNotifications");

const defaultNotificationSettings = {
  enabled: true,
  sound: true,
  vibration: true,
  preview: true
};

let notificationSettings = { ...defaultNotificationSettings };

try {
  const savedNotificationSettings = localStorage.getItem(
    NOTIFICATION_SETTINGS_KEY
  );

  if (savedNotificationSettings) {
    notificationSettings = {
      ...defaultNotificationSettings,
      ...JSON.parse(savedNotificationSettings)
    };
  }
} catch (error) {
  console.warn("Gagal membaca pengaturan notifikasi:", error);
}

function simpanPengaturanNotifikasi() {
  try {
    localStorage.setItem(
      NOTIFICATION_SETTINGS_KEY,
      JSON.stringify(notificationSettings)
    );

    if (notificationStatus) {
      notificationStatus.textContent =
        "Pengaturan notifikasi berhasil disimpan di perangkat ini.";
    }
  } catch (error) {
    if (notificationStatus) {
      notificationStatus.textContent =
        "Pengaturan berubah, tetapi gagal disimpan.";
    }

    console.warn("Gagal menyimpan pengaturan notifikasi:", error);
  }
}

Object.entries(notificationControls).forEach(function([key, control]) {
  if (!control) return;

  control.checked = notificationSettings[key];

  control.addEventListener("change", function() {
    notificationSettings[key] = control.checked;
    simpanPengaturanNotifikasi();
  });
});

if (enableBrowserNotifications) {
  enableBrowserNotifications.addEventListener("click", async function() {
    if (!("Notification" in window)) {
      notificationStatus.textContent =
        "Browser ini belum mendukung notifikasi.";
      return;
    }

    if (Notification.permission === "granted") {
      notificationStatus.textContent =
        "Izin notifikasi browser sudah aktif.";
      return;
    }

    if (Notification.permission === "denied") {
      notificationStatus.textContent =
        "Izin ditolak. Ubah izin DateChat melalui pengaturan situs di browser.";
      return;
    }

    try {
      const permission = await Notification.requestPermission();

      notificationStatus.textContent =
        permission === "granted"
          ? "Izin notifikasi browser berhasil diaktifkan."
          : "Izin notifikasi belum diberikan.";
    } catch (error) {
      notificationStatus.textContent =
        "Tidak dapat meminta izin notifikasi browser.";
      console.warn("Permintaan izin notifikasi gagal:", error);
    }
  });
}

/* PENGATURAN WARNA AKSEN DATECHAT */
const accentSelect = document.getElementById("accentSelect");
const accentStatus = document.getElementById("accentStatus");
const ACCENT_STORAGE_KEY = "datechatAccent";

function applyDateChatAccent(accent) {
  const validAccent = ["blue", "purple", "green", "red"].includes(accent)
    ? accent
    : "blue";

  document.documentElement.dataset.accent = validAccent;

  if (accentSelect) {
    accentSelect.value = validAccent;
  }
}

let savedAccent = "blue";

try {
  savedAccent = localStorage.getItem(ACCENT_STORAGE_KEY) || "blue";
} catch (error) {
  console.warn("Tidak dapat membaca warna aksen:", error);
}

applyDateChatAccent(savedAccent);

if (accentSelect) {
  accentSelect.addEventListener("change", function() {
    const selectedAccent = this.value;
    applyDateChatAccent(selectedAccent);

    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, selectedAccent);
      if (accentStatus) {
        accentStatus.textContent = "Warna aksen berhasil disimpan.";
      }
    } catch (error) {
      if (accentStatus) {
        accentStatus.textContent = "Warna berubah, tetapi gagal disimpan.";
      }
      console.warn("Tidak dapat menyimpan warna aksen:", error);
    }
  });
}

/* PENGATURAN UKURAN TEKS DATECHAT */
const textSizeSelect = document.getElementById("textSizeSelect");
const textSizeStatus = document.getElementById("textSizeStatus");
const TEXT_SIZE_STORAGE_KEY = "datechatTextSize";

function applyDateChatTextSize(size) {
  const validSize = ["small", "medium", "large"].includes(size)
    ? size
    : "medium";

  document.documentElement.dataset.textSize = validSize;

  if (textSizeSelect) {
    textSizeSelect.value = validSize;
  }
}

let savedTextSize = "medium";

try {
  savedTextSize = localStorage.getItem(TEXT_SIZE_STORAGE_KEY) || "medium";
} catch (error) {
  console.warn("Tidak dapat membaca ukuran teks:", error);
}

applyDateChatTextSize(savedTextSize);

if (textSizeSelect) {
  textSizeSelect.addEventListener("change", function() {
    const selectedSize = this.value;
    applyDateChatTextSize(selectedSize);

    try {
      localStorage.setItem(TEXT_SIZE_STORAGE_KEY, selectedSize);
      if (textSizeStatus) {
        textSizeStatus.textContent = "Ukuran teks berhasil disimpan.";
      }
    } catch (error) {
      if (textSizeStatus) {
        textSizeStatus.textContent = "Ukuran berubah, tetapi gagal disimpan.";
      }
      console.warn("Tidak dapat menyimpan ukuran teks:", error);
    }
  });
}

/* PENGATURAN PRIVASI DATECHAT */
const onlineVisibilitySelect = document.getElementById("onlineVisibilitySelect");
const lastSeenVisibilitySelect = document.getElementById("lastSeenVisibilitySelect");
const privacyStatus = document.getElementById("privacyStatus");

const PRIVACY_STORAGE_KEY = "datechatPrivacySettings";

const defaultPrivacySettings = {
  onlineVisibility: "everyone",
  lastSeenVisibility: "everyone"
};

let privacySettings = { ...defaultPrivacySettings };

function normalizePrivacySettings(data) {
  return {
    onlineVisibility: ["everyone", "nobody"].includes(data?.onlineVisibility)
      ? data.onlineVisibility
      : "everyone",
    lastSeenVisibility: ["everyone", "nobody"].includes(data?.lastSeenVisibility)
      ? data.lastSeenVisibility
      : "everyone"
  };
}

try {
  const savedPrivacy = JSON.parse(
    localStorage.getItem(PRIVACY_STORAGE_KEY) || "{}"
  );
  privacySettings = normalizePrivacySettings(savedPrivacy);
} catch (error) {
  console.warn("Tidak dapat membaca pengaturan privasi:", error);
}

function applyPrivacySettings() {
  if (onlineVisibilitySelect) {
    onlineVisibilitySelect.value = privacySettings.onlineVisibility;
  }

  if (lastSeenVisibilitySelect) {
    lastSeenVisibilitySelect.value = privacySettings.lastSeenVisibility;
  }
}

async function savePrivacySettings() {
  try {
    localStorage.setItem(
      PRIVACY_STORAGE_KEY,
      JSON.stringify(privacySettings)
    );
  } catch (error) {
    console.warn("Tidak dapat menyimpan cache privasi:", error);
  }

  if (!currentUser) {
    if (privacyStatus) {
      privacyStatus.textContent = "Login diperlukan untuk menyimpan ke Firebase.";
    }
    return;
  }

  if (privacyStatus) {
    privacyStatus.textContent = "Menyimpan pengaturan ke Firebase...";
  }

  try {
    await updateDoc(doc(db, "users", currentUser.uid), {
      privacySettings: { ...privacySettings }
    });

    await sinkronkanPrivasiPresence();

    if (privacyStatus) {
      privacyStatus.textContent = "Pengaturan privasi berhasil disimpan ke Firebase.";
    }
  } catch (error) {
    console.error("Gagal menyimpan privasi ke Firebase:", error);

    if (privacyStatus) {
      privacyStatus.textContent =
        "Gagal menyimpan ke Firebase. Periksa koneksi dan Firestore Rules.";
    }
  }
}

async function loadPrivacySettingsFromFirebase(accountData) {
  const cloudSettings = accountData?.privacySettings;

  if (cloudSettings && typeof cloudSettings === "object") {
    privacySettings = normalizePrivacySettings(cloudSettings);
    applyPrivacySettings();

    try {
      localStorage.setItem(
        PRIVACY_STORAGE_KEY,
        JSON.stringify(privacySettings)
      );
    } catch (error) {
      console.warn("Tidak dapat memperbarui cache privasi:", error);
    }

    if (privacyStatus) {
      privacyStatus.textContent = "Pengaturan privasi dimuat dari Firebase.";
    }
    return;
  }

  applyPrivacySettings();
  await savePrivacySettings();
}

applyPrivacySettings();

if (onlineVisibilitySelect) {
  onlineVisibilitySelect.addEventListener("change", async function() {
    privacySettings.onlineVisibility = this.value;
    await savePrivacySettings();
  });
}

if (lastSeenVisibilitySelect) {
  lastSeenVisibilitySelect.addEventListener("change", async function() {
    privacySettings.lastSeenVisibility = this.value;
    await savePrivacySettings();
  });
}



// DATECHAT - ANDROID KEYBOARD VIEWPORT FIX
(function () {
  function sesuaikanViewportChat() {
    if (!chatScreen) return;

    const viewport = window.visualViewport;

    if (viewport) {
      chatScreen.style.setProperty(
        "--dc-visible-height",
        Math.max(0, viewport.height) + "px"
      );
      chatScreen.style.setProperty(
        "--dc-visible-top",
        Math.max(0, viewport.offsetTop) + "px"
      );
    } else {
      chatScreen.style.setProperty(
        "--dc-visible-height",
        window.innerHeight + "px"
      );
      chatScreen.style.setProperty("--dc-visible-top", "0px");
    }
  }

  sesuaikanViewportChat();

  window.addEventListener("resize", sesuaikanViewportChat);

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", sesuaikanViewportChat);
    window.visualViewport.addEventListener("scroll", sesuaikanViewportChat);
  }

  document.addEventListener("focusin", function (event) {
    if (chatScreen && chatScreen.contains(event.target)) {
      sesuaikanViewportChat();
    }
  });
})();
