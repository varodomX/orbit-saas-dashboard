"use client";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  ArrowUpRight,
  Plus,
  Search,
  LogOut,
  Orbit,
  ChevronRight,
  TrendingUp,
  Wallet,
  CheckCircle2,
  Activity,
  Pencil,
  Trash2,
  X,
  ShieldCheck,
  Download,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
type User = { id: number; name: string; email: string; role: string };
type Project = {
  id: number;
  name: string;
  client: string;
  budget: number;
  status: string;
  owner: number;
  ownerName: string;
  created: string;
};
const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
export default function Page() {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true),
    [tab, setTab] = useState("Overview"),
    [projects, setProjects] = useState<Project[]>([]),
    [users, setUsers] = useState<User[]>([]),
    [search, setSearch] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [modal, setModal] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [period, setPeriod] = useState("All time");
  async function api(path: string, method = "GET", body?: unknown) {
    const res = await fetch("/api/" + path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) setUser(null);
      throw new Error(data.error || "Request failed");
    }
    return data;
  }
  async function refresh(u: User) {
    const result = await Promise.all([
      api("projects"),
      u.role === "Admin" ? api("users") : Promise.resolve([]),
    ]);
    setProjects(result[0]);
    setUsers(result[1]);
  }
  useEffect(() => {
    api("session")
      .then(async (d) => {
        setUser(d.user);
        if (d.user) await refresh(d.user);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const d = await api("session", "POST", {
        email: f.get("email"),
        password: f.get("password"),
      });
      setUser(d.user);
      await refresh(d.user);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const body =
      modal.kind === "users"
        ? { ...data, id: modal.id }
        : {
            ...data,
            id: modal.id,
            budget: Number(data.budget),
            owner: Number(data.owner || user.id),
          };
    try {
      await api(modal.kind, modal.id ? "PATCH" : "POST", body);
      await refresh(user);
      setModal(null);
      setNotice("Changes saved successfully");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(kind: string, id: number) {
    if (!confirm("Delete this record? This action cannot be undone.")) return;
    try {
      await api(kind, "DELETE", { id });
      await refresh(user!);
      setNotice("Record deleted");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function exportCSV() {
    const visible = filtered;
    const csv = [
      "Project,Client,Budget,Status,Owner",
      ...visible.map((p) =>
        [p.name, p.client, p.budget, p.status, p.ownerName]
          .map(
            (v) =>
              '"' +
              String(v)
                .replace(/^[=+@-]/, "'")
                .replaceAll('"', '""') +
              '"',
          )
          .join(","),
      ),
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "orbit-projects.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  if (loading)
    return (
      <div className="loading">
        <Orbit size={36} /> Loading your workspace…
      </div>
    );
  if (!user)
    return (
      <main className="login">
        <section className="login-story">
          <div className="brand">
            <Orbit /> orbit<span>WORKSPACE</span>
          </div>
          <div>
            <span className="eyebrow">YOUR BUSINESS, IN ORBIT</span>
            <h1>
              Great work starts
              <br />
              with a clear view.
            </h1>
            <p>
              One workspace for your projects, your people,
              <br />
              and your next big idea.
            </p>
            <div className="orbit-art">
              <div />
              <div />
              <Orbit size={88} />
            </div>
          </div>
          <small>Next.js · SQLite · Role-based access</small>
        </section>
        <section className="login-form">
          <div>
            <span className="pill">
              <ShieldCheck size={15} /> Portfolio demo
            </span>
            <h2>Welcome back</h2>
            <p>Sign in to your business workspace.</p>
            <form onSubmit={login}>
              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  defaultValue="admin@orbit.demo"
                  required
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  defaultValue="OrbitDemo123!"
                  required
                />
              </label>
              {error && (
                <div role="alert" className="error">
                  {error}
                </div>
              )}
              <button className="primary" disabled={busy}>
                {busy ? "Signing in…" : "Sign in to workspace"}
                <ArrowUpRight size={18} />
              </button>
            </form>
            <div className="demo">
              <b>Take it for a spin</b>
              <p>
                Both demo accounts use <code>OrbitDemo123!</code>
              </p>
              <button
                onClick={() => {
                  const input =
                    document.querySelector<HTMLInputElement>(
                      "input[name=email]",
                    );
                  if (input) input.value = "admin@orbit.demo";
                }}
              >
                Admin demo <ChevronRight size={14} />
              </button>
              <button
                onClick={() => {
                  const input =
                    document.querySelector<HTMLInputElement>(
                      "input[name=email]",
                    );
                  if (input) input.value = "user@orbit.demo";
                }}
              >
                User demo <ChevronRight size={14} />
              </button>
              <small>
                Demo data is shared. Please use fictional information.
              </small>
            </div>
          </div>
        </section>
      </main>
    );
  const scoped = projects.filter(
    (p) =>
      period === "All time" ||
      new Date(p.created).getTime() >= Date.now() - 30 * 86400000,
  );
  const total = scoped.reduce((s, p) => s + p.budget, 0),
    complete = scoped.filter((p) => p.status === "Completed").length;
  const filtered = scoped.filter((p) =>
    (p.name + " " + p.client + " " + p.status)
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const chart = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 5 + i);
    const key = d.toISOString().slice(0, 7);
    return {
      month: d.toLocaleString("en", { month: "short" }),
      value: scoped
        .filter((p) => p.created.startsWith(key))
        .reduce((s, p) => s + p.budget, 0),
    };
  });
  const distribution = ["Planning", "In progress", "Completed"].map(
    (status) => ({
      name: status,
      count: scoped.filter((p) => p.status === status).length,
    }),
  );
  return (
    <div className="shell">
      <aside>
        <div className="brand">
          <Orbit /> orbit<span>WORKSPACE</span>
        </div>
        <button className="workspace">
          <span className="workspace-icon">O</span>
          <span>
            Orbit Studio<small>Business workspace</small>
          </span>
          <ChevronRight size={16} />
        </button>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {[
            { name: "Overview", icon: LayoutDashboard },
            { name: "Projects", icon: FolderKanban },
            ...(user.role === "Admin" ? [{ name: "Team", icon: Users }] : []),
          ].map((item) => (
            <button
              key={item.name}
              className={tab === item.name ? "selected" : ""}
              onClick={() => {
                setTab(item.name);
                setSearch("");
                setError("");
                setNotice("");
              }}
            >
              <item.icon size={19} />
              {item.name}
              {item.name === "Projects" && <span>{projects.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="tiny-orbit">✧</span>
            <b>Room for your next idea.</b>
            <p>
              A little clarity goes a long way.
              <br />
              Let's build something great.
            </p>
            <span>
              YOUR WORK, CONNECTED <ArrowUpRight size={14} />
            </span>
          </div>
          <div className="profile">
            <div className="avatar">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <b>{user.name}</b>
              <small>{user.role} account</small>
            </div>
            <button
              title="Sign out"
              aria-label="Sign out"
              onClick={async () => {
                try {
                  await api("session", "DELETE");
                  setUser(null);
                  setTab("Overview");
                  setNotice("");
                  setError("");
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main">
        <header>
          <div>
            Workspace <ChevronRight size={14} />
            <b>{tab}</b>
          </div>
          <span className="header-right">
            <span className="live-dot" /> Workspace live{" "}
            <span className="avatar small">{user.name[0]}</span>
          </span>
        </header>
        <main className="content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">YOUR WORKSPACE AT A GLANCE</span>
              <h1>
                {tab === "Overview"
                  ? "Business overview"
                  : tab === "Projects"
                    ? "Your projects"
                    : "People & permissions"}
                <span className="heading-dot">.</span>
              </h1>
              <p>
                {tab === "Overview"
                  ? `Welcome back, ${user.name.split(" ")[0]}. Here’s how things are shaping up.`
                  : tab === "Projects"
                    ? "Bring every project, client, and milestone into focus."
                    : "A great business starts with a great team."}
              </p>
            </div>
            <button
              className="primary"
              onClick={() => {
                setError("");
                setModal({ kind: tab === "Team" ? "users" : "projects" });
              }}
            >
              <Plus size={17} />
              {tab === "Team" ? "Add member" : "New project"}
            </button>
          </div>
          {error && (
            <div className="error" role="alert">
              {error}
              <button onClick={() => setError("")} aria-label="Dismiss error">
                <X size={16} />
              </button>
            </div>
          )}
          {notice && (
            <div className="notice" role="status">
              {notice}
              <button onClick={() => setNotice("")} aria-label="Dismiss notice">
                <X size={16} />
              </button>
            </div>
          )}
          {tab === "Overview" && (
            <>
              <div className="section-line">
                <h3>Performance snapshot</h3>
                <select
                  aria-label="Date range"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  <option>All time</option>
                  <option>Last 30 days</option>
                </select>
              </div>
              <div className="stats">
                {[
                  {
                    label: "Total project value",
                    value: money(total),
                    caption: "Across your project portfolio",
                    icon: Wallet,
                  },
                  {
                    label: "Active projects",
                    value: scoped.filter((p) => p.status === "In progress")
                      .length,
                    caption: "Moving great ideas forward",
                    icon: FolderKanban,
                  },
                  {
                    label: "Completed projects",
                    value: complete,
                    caption: `${scoped.length ? Math.round((complete / scoped.length) * 100) : 0}% of your projects delivered`,
                    icon: CheckCircle2,
                  },
                  {
                    label:
                      user.role === "Admin" ? "Team members" : "Your projects",
                    value: user.role === "Admin" ? users.length : scoped.length,
                    caption:
                      user.role === "Admin"
                        ? "Connected in one workspace"
                        : "Assigned to your account",
                    icon: Users,
                  },
                ].map((s, i) => (
                  <div className="stat" key={s.label}>
                    <div>
                      <span>{s.label}</span>
                      <s.icon size={18} />
                    </div>
                    <strong>{s.value}</strong>
                    <small>
                      <span className={i === 0 ? "green" : "muted"}>
                        {i === 0 ? (
                          <TrendingUp size={14} />
                        ) : (
                          <Activity size={14} />
                        )}
                      </span>
                      {s.caption}
                    </small>
                  </div>
                ))}
              </div>
              <div className="charts">
                <section className="card revenue">
                  <div className="card-title">
                    <div>
                      <h3>Project value</h3>
                      <p>New project budgets by month</p>
                    </div>
                    <span className="legend">
                      <i /> Budget
                    </span>
                  </div>
                  <div className="chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chart}
                        margin={{ top: 15, right: 8, bottom: 0, left: -15 }}
                      >
                        <defs>
                          <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                            <stop
                              offset="0%"
                              stopColor="#7c5ce7"
                              stopOpacity={0.25}
                            />
                            <stop
                              offset="100%"
                              stopColor="#7c5ce7"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="#efedf3" />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#8c8997", fontSize: 12 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#8c8997", fontSize: 11 }}
                          tickFormatter={(v) => "$" + v / 1000 + "k"}
                        />
                        <Tooltip formatter={(v) => money(Number(v))} />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#7c5ce7"
                          strokeWidth={3}
                          fill="url(#fill)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>
                <section className="card">
                  <div className="card-title">
                    <div>
                      <h3>Project health</h3>
                      <p>A clear view of your pipeline</p>
                    </div>
                    <Activity size={19} color="#9691a1" />
                  </div>
                  <div className="chart short">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={distribution}>
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "#888" }}
                        />
                        <YAxis allowDecimals={false} hide />
                        <Tooltip />
                        <Bar
                          dataKey="count"
                          fill="#9c87ed"
                          radius={[7, 7, 0, 0]}
                          barSize={38}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="health-footer">
                    <span className="green">
                      <CheckCircle2 size={16} />
                    </span>
                    <span>
                      <b>{complete} projects delivered</b>
                      <small>Every milestone counts.</small>
                    </span>
                  </div>
                </section>
              </div>
            </>
          )}
          <section className="card table-card">
            <div className="card-title">
              <div>
                <h3>
                  {tab === "Team"
                    ? "Team directory"
                    : tab === "Overview"
                      ? "Recent projects"
                      : "Project directory"}{" "}
                  <span className="count">
                    {tab === "Team" ? users.length : filtered.length}
                  </span>
                </h3>
                <p>
                  {tab === "Team"
                    ? "Manage access and keep everyone connected."
                    : "The details that keep your business moving."}
                </p>
              </div>
              {tab === "Overview" ? (
                <button
                  className="text-button"
                  onClick={() => setTab("Projects")}
                >
                  View all projects <ArrowUpRight size={15} />
                </button>
              ) : (
                <button
                  className="secondary"
                  onClick={
                    tab === "Team"
                      ? () => {
                          setError("");
                          setModal({ kind: "users" });
                        }
                      : exportCSV
                  }
                >
                  {tab === "Team" ? <Plus size={15} /> : <Download size={15} />}{" "}
                  {tab === "Team" ? "Add member" : "Export CSV"}
                </button>
              )}
            </div>
            <div className="table-toolbar">
              <label className="search">
                <Search size={16} />
                <input
                  placeholder={
                    tab === "Team" ? "Search members…" : "Search projects…"
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <span>
                {tab === "Team"
                  ? "Role-based access enabled"
                  : user.role === "Admin"
                    ? "All workspace projects"
                    : "Your assigned projects"}
              </span>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {(tab === "Team"
                      ? ["Member", "Email address", "Role", "Actions"]
                      : [
                          "Project name",
                          "Client",
                          "Status",
                          "Budget",
                          "Owner",
                          "Actions",
                        ]
                    ).map((x) => (
                      <th key={x}>{x}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tab === "Team"
                    ? users
                        .filter((u) =>
                          (u.name + u.email)
                            .toLowerCase()
                            .includes(search.toLowerCase()),
                        )
                        .map((u) => (
                          <tr key={u.id}>
                            <td>
                              <div className="person">
                                <span className="avatar small">
                                  {u.name[0]}
                                </span>
                                <b>{u.name}</b>
                              </div>
                            </td>
                            <td>{u.email}</td>
                            <td>
                              <span
                                className={
                                  "badge " +
                                  (u.role === "Admin" ? "progress" : "planning")
                                }
                              >
                                {u.role}
                              </span>
                            </td>
                            <td>
                              {u.id === user.id ? (
                                <small>You</small>
                              ) : (
                                <div className="actions">
                                  <button
                                    aria-label={"Edit " + u.name}
                                    onClick={() => {
                                      setError("");
                                      setModal({ ...u, kind: "users" });
                                    }}
                                  >
                                    <Pencil size={15} />
                                  </button>
                                  <button
                                    aria-label={"Delete " + u.name}
                                    onClick={() => remove("users", u.id)}
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                    : filtered
                        .slice(0, tab === "Overview" ? 5 : undefined)
                        .map((p, i) => (
                          <tr key={p.id}>
                            <td>
                              <div className="person">
                                <span className={"project-icon tone" + (i % 3)}>
                                  <FolderKanban size={17} />
                                </span>
                                <span>
                                  <b>{p.name}</b>
                                  <small>
                                    PRJ-{String(p.id).padStart(3, "0")}
                                  </small>
                                </span>
                              </div>
                            </td>
                            <td>{p.client}</td>
                            <td>
                              <span
                                className={
                                  "badge " +
                                  (p.status === "Completed"
                                    ? "completed"
                                    : p.status === "In progress"
                                      ? "progress"
                                      : "planning")
                                }
                              >
                                <i />
                                {p.status}
                              </span>
                            </td>
                            <td className="budget">{money(p.budget)}</td>
                            <td>
                              <div className="person">
                                <span className="avatar tiny">
                                  {p.ownerName[0]}
                                </span>
                                {p.ownerName.split(" ")[0]}
                              </div>
                            </td>
                            <td>
                              <div className="actions">
                                <button
                                  aria-label={"Edit " + p.name}
                                  onClick={() => {
                                    setError("");
                                    setModal({ ...p, kind: "projects" });
                                  }}
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  aria-label={"Delete " + p.name}
                                  onClick={() => remove("projects", p.id)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                </tbody>
              </table>
              {(tab === "Team"
                ? users.filter((u) =>
                    (u.name + u.email)
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  ).length === 0
                : filtered.length === 0) && (
                <div className="empty">
                  No results found. Try another search or add a new record.
                </div>
              )}
            </div>
            <div className="table-footer">
              <span>
                {tab === "Team" ? users.length : filtered.length} records in
                your workspace
              </span>
              <span>
                <span className="live-dot" /> Saved to SQLite
              </span>
            </div>
          </section>
          <footer>
            Built for better business.
            <span>Orbit Workspace · Full stack portfolio</span>
          </footer>
        </main>
      </div>
      {modal && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="card-title">
              <h2 id="modal-title">
                {modal.id ? "Edit" : "New"}{" "}
                {modal.kind === "users" ? "team member" : "project"}
              </h2>
              <button
                aria-label="Close dialog"
                onClick={() => {
                  setModal(null);
                  setError("");
                }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={save}>
              <label>
                {modal.kind === "users" ? "Full name" : "Project name"}
                <input
                  name="name"
                  defaultValue={modal.name}
                  required
                  maxLength={100}
                  autoFocus
                />
              </label>
              {modal.kind === "users" ? (
                <>
                  <label>
                    Email address
                    <input
                      type="email"
                      name="email"
                      defaultValue={modal.email}
                      required
                    />
                  </label>
                  {!modal.id && (
                    <label>
                      Initial password
                      <input
                        type="password"
                        name="password"
                        required
                        minLength={12}
                        maxLength={128}
                      />
                      <small>At least 12 characters</small>
                    </label>
                  )}
                  <label>
                    Role
                    <select name="role" defaultValue={modal.role || "User"}>
                      <option>User</option>
                      <option>Admin</option>
                    </select>
                  </label>
                </>
              ) : (
                <>
                  <label>
                    Client
                    <input
                      name="client"
                      defaultValue={modal.client}
                      required
                      maxLength={100}
                    />
                  </label>
                  <div className="form-grid">
                    <label>
                      Budget (USD)
                      <input
                        name="budget"
                        type="number"
                        min="0"
                        max="100000000"
                        step="0.01"
                        defaultValue={modal.budget || 0}
                        required
                      />
                    </label>
                    <label>
                      Status
                      <select
                        name="status"
                        defaultValue={modal.status || "Planning"}
                      >
                        <option>Planning</option>
                        <option>In progress</option>
                        <option>Completed</option>
                      </select>
                    </label>
                  </div>
                  {user.role === "Admin" && (
                    <label>
                      Project owner
                      <select
                        name="owner"
                        defaultValue={modal.owner || user.id}
                      >
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </>
              )}
              {error && (
                <div className="error" role="alert">
                  {error}
                </div>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setModal(null);
                    setError("");
                  }}
                >
                  Cancel
                </button>
                <button className="primary" disabled={busy}>
                  {busy ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
