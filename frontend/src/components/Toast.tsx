// Toast notifications — non-intrusive, auto-dismiss.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '@/src/theme';

type ToastKind = 'success' | 'info' | 'warning' | 'error';
type Toast = { id: string; message: string; kind: ToastKind };

type ToastCtx = { show: (message: string, kind?: ToastKind) => void };
const Ctx = createContext<ToastCtx>({ show: () => {} });

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<Toast | null>(null);
  const opacity = React.useRef(new Animated.Value(0)).current;

  const show = useCallback(
    (message: string, kind: ToastKind = 'success') => {
      setToast({ id: Math.random().toString(36), message, kind });
    },
    [],
  );

  useEffect(() => {
    if (!toast) return;
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setToast(null));
    }, 2600);
    return () => clearTimeout(t);
  }, [toast, opacity]);

  const iconMap: Record<ToastKind, keyof typeof Ionicons.glyphMap> = {
    success: 'checkmark-circle',
    info: 'information-circle',
    warning: 'alert-circle',
    error: 'close-circle',
  };
  const colorMap: Record<ToastKind, string> = {
    success: colors.success,
    info: colors.info,
    warning: colors.warning,
    error: colors.error,
  };

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      {toast ? (
        <Animated.View
          testID="toast"
          pointerEvents="none"
          style={[styles.wrap, { opacity }]}
        >
          <View style={styles.toast}>
            <Ionicons name={iconMap[toast.kind]} size={18} color={colorMap[toast.kind]} />
            <Text style={styles.msg}>{toast.message}</Text>
          </View>
        </Animated.View>
      ) : null}
    </Ctx.Provider>
  );
};

export const useToast = () => useContext(Ctx);

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceInverse,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    maxWidth: '92%',
  },
  msg: { color: colors.onSurfaceInverse, fontSize: fontSize.sm, fontWeight: '600' },
});
