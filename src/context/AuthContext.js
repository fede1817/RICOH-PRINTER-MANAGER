import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authCredentials, setAuthCredentials] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedCred = localStorage.getItem("authCredentials");
    const storedAdmin = localStorage.getItem("isAdmin");

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedCred) setAuthCredentials(storedCred);
    if (storedAdmin) setIsAdmin(storedAdmin === "true");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        authCredentials,
        setAuthCredentials,
        isAdmin,
        setIsAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
