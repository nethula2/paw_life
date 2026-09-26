package com.pawlife;

public class HttpUtils {
    public static int toInt(Object val, int def) {
        if (val == null) return def;
        if (val instanceof Number) return ((Number) val).intValue();
        try { return (int) Double.parseDouble(val.toString().trim()); } catch (Exception e) { return def; }
    }

    public static long toLong(Object val, long def) {
        if (val == null) return def;
        if (val instanceof Number) return ((Number) val).longValue();
        try { return (long) Double.parseDouble(val.toString().trim()); } catch (Exception e) { return def; }
    }

    public static double toDouble(Object val, double def) {
        if (val == null) return def;
        if (val instanceof Number) return ((Number) val).doubleValue();
        try { return Double.parseDouble(val.toString().trim()); } catch (Exception e) { return def; }
    }
}
