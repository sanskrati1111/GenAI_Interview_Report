import { useContext, useEffect, useRef } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe } from "../services/auth.api";

// Track if we've already checked auth to avoid duplicate calls
let authCheckDone = false;

export const useAuth = () => {

    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context
    const hasInitialized = useRef(false);


    const handleLogin = async ({ email, password }) => {
        setLoading(true)
        try {
            const data = await login({ email, password })
            if (data && data.user) {
                setUser(data.user)
                return { success: true }
            }
            return { success: false, message: data?.message || 'Login failed' }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Login failed'
            console.error('Login error:', errorMessage)
            return { success: false, message: errorMessage }
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true)
        try {
            const data = await register({ username, email, password })
            if (data && data.user) {
                setUser(data.user)
                return { success: true }
            }
            return { success: false, message: data?.message || 'Registration failed' }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Registration failed'
            console.error('Register error:', errorMessage)
            return { success: false, message: errorMessage }
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            await logout()
            setUser(null)
            authCheckDone = false;  // Reset flag on logout so next page load checks auth
        } catch (err) {
            console.error('Logout error:', err)
            setUser(null)
            authCheckDone = false;  // Reset even if error
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        
        // Only check auth once globally, not on every component mount
        if (authCheckDone || hasInitialized.current) {
            return;
        }
        
        hasInitialized.current = true;

        const getAndSetUser = async () => {
            setLoading(true)
            try {
                const data = await getMe()
                if (data && data.user) {
                    setUser(data.user)
                } else {
                    setUser(null)
                }
            } catch (err) {
                console.error('Get user error:', err)
                setUser(null)
            } finally {
                setLoading(false)
                authCheckDone = true;  // Mark auth check as done globally
            }
        }

        getAndSetUser()

    }, [])

    return { user, loading, handleRegister, handleLogin, handleLogout }
}