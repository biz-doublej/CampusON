/**
 * Dynamic Environment Configuration
 * Manages API endpoints and application settings based on environment
 * Eliminates hardcoding by using environment variables and runtime detection
 */

export interface ApiEndpoints {
  auth: string;
  dashboard: string;
  admin: string;
  professor: string;
  student: string;
  upload: string;
}

export interface AppConfig {
  apiBaseUrl: string;
  endpoints: ApiEndpoints;
  features: {
    enableSocialLogin: boolean;
    enablePdfParsing: boolean;
    enableAdvancedAnalytics: boolean;
    enableDepartmentSpecificFeatures: boolean;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: 'ko' | 'en';
    animation: boolean;
    compactMode: boolean;
  };
  security: {
    tokenExpiry: number;
    maxLoginAttempts: number;
    sessionTimeout: number;
  };
}

class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfiguration(): AppConfig {
    // Environment-based configuration
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Dynamic API base URL detection
    const apiBaseUrl = this.getApiBaseUrl();

    return {
      apiBaseUrl,
      endpoints: {
        auth: '/api/auth',
        dashboard: '/api/dashboard',
        admin: '/api/admin',
        professor: '/api/professor',
        student: '/api/student',
        upload: '/api/upload'
      },
      features: {
        enableSocialLogin: process.env.NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN === 'true',
        enablePdfParsing: process.env.NEXT_PUBLIC_ENABLE_PDF_PARSING === 'true' || true, // Default enabled
        enableAdvancedAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
        enableDepartmentSpecificFeatures: true // Always enabled for CampusON
      },
      ui: {
        theme: (process.env.NEXT_PUBLIC_DEFAULT_THEME as any) || 'light',
        language: (process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE as any) || 'ko',
        animation: process.env.NEXT_PUBLIC_ENABLE_ANIMATIONS !== 'false',
        compactMode: process.env.NEXT_PUBLIC_COMPACT_MODE === 'true'
      },
      security: {
        tokenExpiry: parseInt(process.env.NEXT_PUBLIC_TOKEN_EXPIRY || '3600000'), // 1 hour default
        maxLoginAttempts: parseInt(process.env.NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS || '5'),
        sessionTimeout: parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT || '1800000') // 30 minutes default
      }
    };
  }

  private getApiBaseUrl(): string {
    // Priority order for API URL determination:
    // 1. Environment variable
    // 2. Runtime detection based on current URL
    // 3. Default localhost for development

    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }

    // Runtime detection for dynamic environments (like Vercel deployments)
    if (typeof window !== 'undefined') {
      const currentHost = window.location.host;
      
      // Production detection patterns
      if (currentHost.includes('vercel.app') || currentHost.includes('campuson')) {
        // Try to construct API URL based on current host
        return `https://${currentHost.replace('frontend-', 'api-')}`;
      }
      
      // Local development detection
      if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
        return 'http://localhost:3001';
      }
    }

    // Server-side default
    return process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3001'
      : 'https://api.campuson.kr'; // Default production URL
  }

  public getConfig(): AppConfig {
    return { ...this.config };
  }

  public getApiUrl(endpoint?: keyof ApiEndpoints): string {
    const baseUrl = this.config.apiBaseUrl;
    if (!endpoint) {
      return baseUrl;
    }
    return `${baseUrl}${this.config.endpoints[endpoint]}`;
  }

  public isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature];
  }

  public getSecurityConfig(): AppConfig['security'] {
    return { ...this.config.security };
  }

  public getUIConfig(): AppConfig['ui'] {
    return { ...this.config.ui };
  }

  // Dynamic configuration updates (for runtime changes)
  public updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  // Environment-specific utilities
  public isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  public isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  public getEnvironmentInfo(): {
    environment: string;
    buildTime: string;
    version: string;
  } {
    return {
      environment: process.env.NODE_ENV || 'unknown',
      buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
    };
  }

  // Dynamic endpoint generation for department-specific APIs
  public getDepartmentEndpoint(department: string, endpoint: string): string {
    const baseUrl = this.config.apiBaseUrl;
    return `${baseUrl}/api/department/${department}/${endpoint}`;
  }

  // Dynamic role-based endpoint generation
  public getRoleBasedEndpoint(role: string, endpoint: string): string {
    const baseUrl = this.config.apiBaseUrl;
    const roleEndpoints = this.config.endpoints as any;
    const roleBase = roleEndpoints[role] || '/api/general';
    return `${baseUrl}${roleBase}/${endpoint}`;
  }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance();

// Convenience exports
export const getApiUrl = (endpoint?: keyof ApiEndpoints) => configManager.getApiUrl(endpoint);
export const isFeatureEnabled = (feature: keyof AppConfig['features']) => configManager.isFeatureEnabled(feature);
export const getConfig = () => configManager.getConfig();

// Environment detection utilities
export const isDev = () => configManager.isDevelopment();
export const isProd = () => configManager.isProduction();