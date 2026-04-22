import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout as logoutAction, getMe } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import { AppDispatch } from '../store';

export const useAuth = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { user, token, isLoading, isError, message } = useSelector(
        (state: any) => state.auth
    );

    const logout = () => {
        dispatch(logoutAction());
        navigate('/login');
    };

    const refreshUser = () => {
        dispatch(getMe());
    };

    return {
        user,
        token,
        isLoading,
        isError,
        message,
        logout,
        refreshUser,
        isAuthenticated: !!token,
        isDonor: user?.role === 'donor',
        isHelper: user?.role === 'helper',
        isInstitution: user?.role === 'institution',
        isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    };
};
