import { useState, useEffect } from "react";
import './App.css';
import { supabase } from "./supabaseClient";

function StorageDisplay({ totalSpace, usedSpace }) {
  const usedPercentage = totalSpace > 0 ? (usedSpace / totalSpace) * 100 : 0;
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
    const email = userData.user.email.replace(/[@.]/g, "_");
    const filePath = `${userId}/${email}_${Date.now()}_${file.name}`;


    const { error } = await supabase.storage
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

function FileTable({ files, onDelete, onRename, renameError, clearRenameError, isAdmin }) {
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
      setSelected(filteredFiles.map((f, i) => i));
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
                  const originalIndex = files.findIndex(f => f.fullPath === file.fullPath);
                  return (
                    <tr key={originalIndex}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.includes(originalIndex)}
                          onChange={() => toggleSelect(originalIndex)}
                        />
                      </td>
                      {}
<td>
  {renameIdx === originalIndex ? (
    <>
      <form
        onSubmit={e => { e.preventDefault(); handleRename(originalIndex); }}
        className="file-table-rename-form"
      >
        <input
          value={newName}
          onChange={e => {
            setNewName(e.target.value);
            clearRenameError();
          }}
          autoFocus
          className="rename-input"
        />
        <button type="submit" className="file-table-rename-btn">✓</button>
      </form>
      {renameError && (
        <div style={{ color: "#db5d7d", marginTop: "6px" }}>
          {renameError}
        </div>
      )}
    </>
  ) : (
    <a
      href={file.url}
      onClick={async (e) => {
        e.preventDefault();
        const LARGE_LIMIT = 10 * 1024 * 1024; 
        if (file.size && file.size > LARGE_LIMIT) {
          window.open(file.url || file.fullPath, "_blank", "noopener");
          return;
        }

        try {
          
          const { data, error } = await supabase
            .storage
            .from("uploads")
            .createSignedUrl(file.fullPath, 60);
          const downloadUrl = data?.signedUrl || file.url;
          const res = await fetch(downloadUrl);
          if (!res.ok) throw new Error("Network response not ok");
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(blobUrl);
        } catch (err) {
          console.error("Download failed, opening in new tab as fallback:", err);
          window.open(file.url, "_blank", "noopener");
        }
      }}
      className="file-link"
      title={file.name}
      rel="noopener noreferrer"
    >
      {shortName(file.name, 18)}
    </a>
  )}
</td>

                      <td className="file-table-date">{timeAgo(file.updated_at)}</td>
                      <td className="file-table-ext">{getExt(file.name)}</td>
                      <td className="file-table-size">{formatSize(file.size)}</td>
                      <td style={{ position: "relative" }}>
                        <button
                          className="ellipsis-btn2"
                          onClick={() => setMenuOpenIdx(menuOpenIdx === originalIndex ? null : originalIndex)}
                          title="More"
                        >⋮</button>
                          {menuOpenIdx === originalIndex && (
                          <div className="menu-dropdown">
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  clearRenameError();
                                  setRenameIdx(originalIndex);
                                  setNewName(file.name);
                                  setMenuOpenIdx(null);
                                }}
                              >
                                Rename
                              </button>
                            )}

                            <button onClick={() => { onDelete(originalIndex); setMenuOpenIdx(null); }}>Delete</button>
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    setUser({ ...user, name: userName, is_admin: profile?.is_admin || false });
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
  const [renameError, setRenameError] = useState("");
  const [renameIdx, setRenameIdx] = useState(null);

  const totalSpace = 1024;

  const clearRenameError = () => setRenameError("");
  const fetchFilesAndUsage = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const userId = userData.user.id;
    const isAdmin = user.is_admin;

    let allFilesData = [];

    if (isAdmin) {
      const { data: folders, error: foldersError } = await supabase.storage.from("uploads").list('', {
        limit: 1000
      });

      if (foldersError) {
        console.error("Admin: Error fetching user folders:", foldersError);
        return;
      }
      
      for (const folder of folders) {
        const ownerId = folder.name;
        const { data: userFiles, error: filesError } = await supabase.storage.from("uploads").list(ownerId, {
          limit: 1000,
        });

        if (filesError) {
          console.error(`Admin: Error fetching files for user ${ownerId}:`, filesError);
          continue;
        }

        if (userFiles) {
          const processedFiles = userFiles.map(file => ({
            ...file,
            fullPath: `${ownerId}/${file.name}`,
            ownerId: ownerId,
          }));
          allFilesData.push(...processedFiles);
        }
      }
    } else {
      const { data: userFiles, error } = await supabase.storage.from("uploads").list(userId, {
        limit: 1000,
      });

      if (error || !userFiles) {
        console.error("User: Error fetching files:", error);
        return;
      }
      allFilesData = userFiles.map(file => ({
        ...file,
        fullPath: `${userId}/${file.name}`,
        ownerId: userId,
      }));
    }

    const validFiles = allFilesData.filter(item => item.metadata && typeof item.metadata.size === "number");
    const filePaths = validFiles.map(f => f.fullPath);
    
    if (filePaths.length === 0) {
      setFiles([]);
      setUsedSpace(0);
      return;
    }

    const { data: signedUrlsData, error: signedUrlsError } = await supabase.storage
      .from("uploads")
      .createSignedUrls(filePaths, 3600);

    if (signedUrlsError || !signedUrlsData) {
      console.error("Error getting signed URLs:", signedUrlsError);
      return;
    }
    
    const filesWithUrls = validFiles.map((file, index) => ({
      name: file.name,
      url: signedUrlsData[index]?.signedUrl || "",
      size: file.metadata.size,
      updated_at: file.updated_at || file.created_at || null,
      fullPath: file.fullPath,
      ownerId: file.ownerId,
    }));
    
    setFiles(filesWithUrls);

    const totalUsed = validFiles.reduce((sum, f) => sum + (f.metadata.size || 0), 0) / (1024 * 1024);
    setUsedSpace(totalUsed);
  };

  useEffect(() => {
    fetchFilesAndUsage();
  }, []);

  const handleUpload = () => fetchFilesAndUsage();

  const handleDelete = async (idx) => {
    const file = files[idx];
    if (!file) return;
    await supabase.storage.from("uploads").remove([file.fullPath]);
    fetchFilesAndUsage();
  };

  const handleRename = async (idx, newName) => {
    const file = files[idx];
    if (!file || !newName || file.name === newName) return;

    const oldPath = file.fullPath;
    const newPath = `${file.ownerId}/${newName}`;

    if (files.some(f => f.fullPath === newPath)) {
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
      <FileTable
        files={files}
        onDelete={handleDelete}
        onRename={handleRename}
        renameError={renameError}
        clearRenameError={clearRenameError}
        renameIdx={renameIdx}
        setRenameIdx={setRenameIdx}
        isAdmin={user.is_admin}  
      />

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
