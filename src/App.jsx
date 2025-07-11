import { useState, useEffect } from "react";
import './App.css';
import { supabase } from "./supabaseClient";

function StorageDisplay({ totalSpace, usedSpace }) {
  const usedPercentage = (usedSpace / totalSpace) * 100;
  const percentage = usedPercentage + 3;
  const usedSpaceMB = usedSpace.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const totalSpaceMB = totalSpace.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const freeSpaceMB = (totalSpace - usedSpace).toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <div className="storage-card">
        <div className="storage-progress-bar">
              <div className="storage-progress-bar-fill"
                style={{ width: `${percentage}%` }}
              ></div>
              </div>
             <span className="percentage-value">{Math.round(usedPercentage)}%</span>
             <span className="used-space-label">used space</span>
   
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

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user.id;
    const filePath = `${userId}/${Date.now()}_${file.name}`;

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
  fetchFilesAndUsage();
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
function FileTable({ files, onDelete, onRename }) {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [filterExt, setFilterExt] = useState("all");
  const [renameIdx, setRenameIdx] = useState(null);
  const [newName, setNewName] = useState("");
  const [menuOpenIdx, setMenuOpenIdx] = useState(null);

  const getExt = (name) => name.split('.').pop().toUpperCase();
  const formatSize = (size) => size ? (size / (1024 * 1024)).toFixed(2) + " MB" : "-";
  const shortName = (name, max = 18) => name.length > max ? name.slice(0, max) + "..." : name;
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

  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesExt = filterExt === "all" || getExt(f.name) === filterExt;
    return matchesSearch && matchesExt;
  });

  const allExts = Array.from(new Set(files.map(f => getExt(f.name))));

  const toggleSelect = (idx) => {
    setSelected(selected.includes(idx) ? selected.filter(i => i !== idx) : [...selected, idx]);
  };

  const handleSelectAll = () => {
    if (selected.length === filteredFiles.length) {
      setSelected([]);
    } else {
      setSelected(filteredFiles.map(f => files.findIndex(ff => ff.name === f.name)));
    }
  };

  const handleDeleteSelected = () => {
    selected.forEach(idx => onDelete(idx));
    setSelected([]);
  };

  const handleRename = async (idx) => {
    await onRename(idx, newName);
    setRenameIdx(null);
    setNewName("");
  };

  return (
    <div className="file-table-wrapper">
      <div className="file-table-controls">
        <input
          type="text"
          placeholder="Search files..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="file-table-search"
        />
        <select
          value={filterExt}
          onChange={e => setFilterExt(e.target.value)}
          className="file-table-filter"
        >
          <option value="all">All types</option>
          {allExts.map(ext => (
            <option key={ext} value={ext}>{ext}</option>
          ))}
        </select>
        {selected.length > 0 && (
          <button className="delete-selected-btn" onClick={handleDeleteSelected}>
            Delete Selected
          </button>
        )}
      </div>
     <div className="file-table-scroll">
  <table className="file-table">
    
          <thead>
            <tr>
              <th className="file-table-checkbox">
                <input
                  type="checkbox"
                  checked={selected.length === filteredFiles.length && filteredFiles.length > 0}
                  onChange={handleSelectAll}
                  title="Select All"
                />
              </th>
              <th className="file-table-name">File Name</th>
              <th className="file-table-date">Uploaded</th>
              <th className="file-table-ext">Format</th>
              <th className="file-table-size">Size</th>
              <th className="file-table-actions"></th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.length === 0 && (
              <tr>
                <td colSpan={6} className="file-table-empty">No files found.</td>
              </tr>
            )}
            {filteredFiles.map((file, idx) => {
              const fileIdx = files.findIndex(f => f.name === file.name);
              return (
                <tr key={fileIdx}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(fileIdx)}
                      onChange={() => toggleSelect(fileIdx)}
                    />
                  </td>
                  <td>
                    {renameIdx === fileIdx ? (
                      <form
                        onSubmit={e => { e.preventDefault(); handleRename(fileIdx); }}
                        className="file-table-rename-form"
                      >
                        <input
                          value={newName}
                          onChange={e => setNewName(e.target.value)}
                          autoFocus
                          className="rename-input"
                        />
                        <button type="submit" className="file-table-rename-btn">✓</button>
                      </form>
                    ) : (
                      <a href={file.url} target="_blank" rel="noopener noreferrer" className="file-table-link">
                        {shortName(file.name)}
                      </a>
                    )}
                  </td>
                  <td className="file-table-date">{timeAgo(file.updated_at)}</td>
                  <td className="file-table-ext">{getExt(file.name)}</td>
                  <td className="file-table-size">{formatSize(file.size)}</td>
                  <td style={{ position: "relative" }}>
                    <button
                      className="ellipsis-btn2"
                      onClick={() => setMenuOpenIdx(menuOpenIdx === fileIdx ? null : fileIdx)}
                      title="More"
                    >⋮</button>
                    {menuOpenIdx === fileIdx && (
                      <div className="menu-dropdown">
                        <button onClick={() => { setRenameIdx(fileIdx); setNewName(file.name); setMenuOpenIdx(null); }}>Rename</button>
                        <button onClick={() => { onDelete(fileIdx); setMenuOpenIdx(null); }}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user.id;

  const { data, error } = await supabase.storage.from("uploads").list(userId, { limit: 1000 });
  if (error || !data) return;

  const allFiles = data.filter(item => item.metadata && typeof item.metadata.size === "number");

  const filesWithSignedUrls = await Promise.all(
    allFiles.map(async (f) => {
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("uploads")
        .createSignedUrl(`${userId}/${f.name}`, 3600);
      if (signedUrlError) {
        console.error("Error getting signed URL:", signedUrlError);
        return null;
      }
      return {
        name: f.name,
        url: signedUrlData.signedUrl,
        size: f.metadata.size,
        updated_at: f.updated_at || f.created_at || null,
      };
    })
  );

  setFiles(filesWithSignedUrls.filter(f => f !== null));

  const totalUsed = allFiles.reduce((sum, f) => sum + (f.metadata.size || 0), 0) / (1024 * 1024);
  setUsedSpace(totalUsed);
};


    useEffect(() => { fetchFilesAndUsage(); }, []);
      const handleUpload = () => fetchFilesAndUsage();
      const handleDelete = async (idx) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user.id;

    const file = files[idx];
    if (!file) return;
    const filePath = `${userId}/${file.name}`;
    await supabase.storage.from("uploads").remove([filePath]);
    fetchFilesAndUsage();
  };

  const handleRename = async (idx, newName) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user.id;

    const file = files[idx];
    if (!file || !newName || file.name === newName) return;

    const oldPath = `${userId}/${file.name}`;
    const newPath = `${userId}/${newName}`;

    if (files.some(f => f.name === newName)) {
      alert("A file with this name already exists.");
      return;
    }

    const { error: copyError } = await supabase.storage.from("uploads").copy(oldPath, newPath);
    if (copyError) {
      alert("Rename failed: " + copyError.message);
      return;
    }
    await supabase.storage.from("uploads").remove([oldPath]);
    fetchFilesAndUsage();
  };

  return (
    <div className="main-page">
      <div style={{ position: "relative" }}>
        {menuOpen && (
          <div className="logout-menu">
            <button
              className="logout-btn"
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
      <div className="main-header">
        <h2 className="welcome">
          Welcome, <span className="username">{user.name}!</span>
        </h2>
      </div>
      <StorageDisplay totalSpace={totalSpace} usedSpace={usedSpace} />
      <FileTable files={files} onDelete={handleDelete} onRename={handleRename} />
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
