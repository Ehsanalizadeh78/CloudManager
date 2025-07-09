import { useState, useEffect } from "react";
import './App.css';
import { supabase } from "./supabaseClient";

function StorageDisplay({ totalSpace, usedSpace }) {
  const usedPercentage = (usedSpace / totalSpace) * 100;
  const usedSpaceMB = usedSpace.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const totalSpaceMB = totalSpace.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const freeSpaceMB = (totalSpace - usedSpace).toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <div className="storage-card">
      <div className="global-statistics">
        <div className="doughnut-chart">
          <div className="circle-background"></div>
          <div
            className="circle-progress"
            style={{
              background: `conic-gradient(#5a9bff ${usedPercentage}%, #e0e0e0 ${usedPercentage}%)`,
            }}
          ></div>
          <div className="chart-center">
            <span className="percentage-value">{Math.round(usedPercentage)}%</span>
            <span className="used-space-label">used space</span>
          </div>
        </div>
        <div className="storage-details">
          <div className="storage-item">
            <div className="color-box total-space-color"></div>
            <span>Total space</span>
            <strong>{totalSpaceMB} MB</strong>
          </div>
          <div className="storage-item">
            <div className="color-box used-space-color"></div>
            <span>Space used</span>
            <strong>{usedSpaceMB} MB</strong>
          </div>
          <div className="storage-item">
            <div className="color-box free-space-color"></div>
            <span>Free space</span>
            <strong>{freeSpaceMB} MB</strong>
          </div>
        </div>
      </div>
    </div>
  );
}


function FileUpload({ onClose, onUpload }) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setFile(e.target.files[0]);
    setErrorMsg("");
  };

  const handleUpload = async () => {
    if (!file) return;
    setProgress(10);
    setErrorMsg("");

    const filePath = `uploads/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from("uploads")
      .upload(filePath, file);

    if (error) {
      setErrorMsg("Upload failed: " + error.message);
      setProgress(0);
      return;
    }

    const { data: publicUrlData } = supabase
      .storage
      .from("uploads")
      .getPublicUrl(filePath);

    setProgress(100);
    onUpload({ name: file.name, url: publicUrlData.publicUrl });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Upload File</h3>
        {errorMsg && <h1 style={{ color: "#db5d7d", fontSize: "1.1rem" }}>{errorMsg}</h1>}
        <input type="file" onChange={handleChange} />
        <div style={{ marginTop: 16 }}>
          <button className="UploadBtn" onClick={handleUpload} disabled={!file}>Upload</button>
          <button className="CancelBtn" onClick={onClose} style={{marginLeft: 8}}>Cancel</button>
        </div>
        {progress === 100 && <p>File uploaded!</p>}
      </div>
    </div>
  );
}

function FileList({ files, onDelete, onRename }) {
  const [menuOpenIdx, setMenuOpenIdx] = useState(null);
  const [renameIdx, setRenameIdx] = useState(null);
  const [newName, setNewName] = useState("");

  const getExt = (name) => name.split('.').pop().toUpperCase();
  const isImage = (name) => /\.(jpe?g|png|gif|bmp|webp)$/i.test(name);

  function timeAgo(dateString) {
    if (!dateString) return "";
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 10) return "just now";
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
    return date.toLocaleDateString("en-US");
  }

  const handleDelete = async (idx) => {
    const file = files[idx];
    if (!file) return;
    const filePath = `uploads/${file.name}`;
    await supabase.storage.from("uploads").remove([filePath]);
    onDelete(idx);
  };

  const handleRename = async (idx, newName) => {
    const file = files[idx];
    if (!file || !newName || file.name === newName) return;
    const oldPath = `uploads/${file.name}`;
    const newPath = `uploads/${newName}`;
    const { error: copyError } = await supabase.storage.from("uploads").copy(oldPath, newPath);
    if (!copyError) {
      await supabase.storage.from("uploads").remove([oldPath]);
    }
    onRename(idx, newName);
  };

  return (
    <div className="listdiv">
      <h2 className="yourfilelist">your files list:</h2>
      {files.length === 0 ? (
        <div className="empty-list">
          your files list is empty!
        </div>
      ) : (
        <ul className="file-list">
          {files.map((file, idx) => (
            <li key={idx} className="file-list-item">
              <div className="file-thumb">
                {isImage(file.name) ? (
                  <img src={file.url} alt={file.name} />
                ) : (
                  <div className="file-icon">{getExt(file.name).slice(0, 3)}</div>
                )}
              </div>
              <div className="file-name">
                {renameIdx === idx ? (
                  <form
                    onSubmit={async e => {
                      e.preventDefault();
                      await handleRename(idx, newName);
                      setRenameIdx(null);
                    }}
                   
                  >
                    <input
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      autoFocus
                      className="rename-input"
                     
                    />
                    <button
                      type="submit"
                     
                      title="Rename"
                    >
                      ✓
                    </button>
                  </form>
                ) : (
                  <a href={file.url} target="_blank" rel="noopener noreferrer">{file.name}</a>
                )}
              </div>
              <div className="file-ext">
                {getExt(file.name)}
                {file.updated_at && (
                  <span className="file-date" style={{ color: '#888', fontSize: 12, marginLeft: 17 }}>
                    {timeAgo(file.updated_at)}
                  </span>
                )}
              </div>
              <div className="file-menu">
                <button
                  className="ellipsis-btn2"
                  onClick={() => setMenuOpenIdx(menuOpenIdx === idx ? null : idx)}
                >⋮</button>
                {menuOpenIdx === idx && (
                  <div className="menu-dropdown">
                    <button onClick={() => { setRenameIdx(idx); setNewName(file.name); setMenuOpenIdx(null); }}>Rename</button>
                    <button onClick={() => { handleDelete(idx); setMenuOpenIdx(null); }}>Delete</button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LoginPage({ setUser }) {
  const [loginType, setLoginType] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [signupMode, setSignupMode] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoginError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoginError("Login failed: " + error.message);
      return;
    }

    const user = data.user;
    const userName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email.split("@")[0];
    setUser({ ...user, name: userName });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoginError("");
    setSignupSuccess(false);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      setLoginError("Sign up failed: " + error.message);
      return;
    }
    setSignupSuccess(true);
    setSignupMode(false);
    setLoginError("");
  };

  return (
    <div className="">
      <div className="top-half-circle"></div>
      <div style={{ marginBottom: 20, textAlign: "center" }}>
        <div className="logo">
          <h1>Cloud Manager</h1>
          <p>a great experience of cloud management</p>
        </div>
        {!loginType && (
          <>
            <button
              className="EmailLoginButton"
              onClick={() => { setLoginType("email"); setSignupMode(false); }}
            >
              Login
            </button>
            <button
              className="SignUpButton"
              onClick={() => { setLoginType("email"); setSignupMode(true); }}
            >
              Sign Up
            </button>
          </>
        )}
      </div>
      {loginType === "email" && !signupMode && (
        <form className="EmailSignUp" onSubmit={handleEmailLogin}>
          {loginError && <div style={{color: "#db5d7d", marginBottom: 10}}>{loginError}</div>}
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="Login">
            <button type="submit">Login</button>
          </div>
        </form>
      )}
      {loginType === "email" && signupMode && (
        <form className="EmailSignUp" onSubmit={handleSignUp}>
          {loginError && <div style={{color: "#db5d7d", marginBottom: 10}}>{loginError}</div>}
          {signupSuccess && <div style={{color: "#4caf50", marginBottom: 10}}>Sign up successful! Please check your email to verify your account.</div>}
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div>
            <button  className="SignUp" type="submit">Sign Up</button>
            <button className="backtologin" type="button"  onClick={() => { setSignupMode(false); setLoginError(""); setSignupSuccess(false); }}>Back to Login</button>
          </div>
        </form>
      )}
    </div>
  );
}

function MainPage({ user, onLogout }) {
  const [showUpload, setShowUpload] = useState(false);
  const [files, setFiles] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [usedSpace, setUsedSpace] = useState(0);
  
  const totalSpace = 1024; 


  const fetchFilesAndUsage = async () => {
    const { data, error } = await supabase.storage.from("uploads").list("uploads", { limit: 1000 });
    if (error || !data) return;

    // Only files (not folders) have a size property
    const allFiles = data.filter(item => item.metadata && typeof item.metadata.size === "number");
    setFiles(
      allFiles.map(f => ({
        name: f.name,
        url: supabase.storage.from("uploads").getPublicUrl(`uploads/${f.name}`).data.publicUrl,
        size: f.metadata.size,
        updated_at: f.updated_at || f.created_at || null
      }))
    );

    const totalUsed = allFiles.reduce((sum, f) => sum + (f.metadata.size || 0), 0) / (1024 * 1024); // bytes to MB
    setUsedSpace(totalUsed);
  };

  useEffect(() => {
    fetchFilesAndUsage();

  }, []);

  const handleUpload = (fileObj) => {
    fetchFilesAndUsage();
  };

  const handleDelete = (idx) => {
    fetchFilesAndUsage();
  };

  const handleRename = (idx, newName) => {
    fetchFilesAndUsage();
  };

  return (
    <div className="main-page">
      <div style={{ position: "relative" }}>
        {menuOpen && (
          <div style={{ position: "absolute", left: 290, top: 32, background: "white", border: "1px solid #ccc", borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", zIndex: 10 }}>
            <button
              style={{ padding: "8px 16px", width: "100%", background: "none", border: "none", textAlign: "center", cursor: "pointer" }}
              onClick={() => { setMenuOpen(false); onLogout(); }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
      <button
        className="ellipsis-btn"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Open menu"
      >
        &#8942;
      </button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="welcome" style={{ marginBottom: 0 }}>
          Welcome, <span className="username">{user.name}!</span>
          <div className="welcome-underline"></div>
        </h2>
      </div>

      {/* Storage Display Component */}
      <StorageDisplay totalSpace={totalSpace} usedSpace={usedSpace} />

      <FileList files={files} onDelete={handleDelete} onRename={handleRename} />
      <button className="fab" onClick={() => setShowUpload(true)}>+</button>
      {showUpload && (
        <FileUpload
          onClose={() => setShowUpload(false)}
          onUpload={handleUpload}
        />
      )}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    // Try to load user from localStorage
    const saved = localStorage.getItem("cloudmanager_user");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("cloudmanager_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("cloudmanager_user");
    }
  }, [user]);

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="app">
      {!user ? (
        <LoginPage setUser={setUser} />
      ) : (
        <MainPage user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
