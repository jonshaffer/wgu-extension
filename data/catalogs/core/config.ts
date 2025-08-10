#!/usr/bin/env npx tsx

/**
 * Production-grade configuration management for WGU Catalog Parser
 * Supports environment-specific configs, validation, and hot reloading
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

export interface ParsingConfig {
  // Parsing behavior
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
  batchSize: number;
  
  // Data quality thresholds
  minCoursesPerCatalog: number;
  minCCNsCoveragePercent: number;
  minCUsCoveragePercent: number;
  
  // Performance settings
  memoryLimitMB: number;
  maxConcurrentParsing: number;
  
  // Output settings
  preserveDetailedDescriptions: boolean;
  outputIndentation: number;
  compressOutput: boolean;
}

export interface DownloadConfig {
  // Download behavior
  userAgent: string;
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
  
  // Rate limiting
  requestsPerSecond: number;
  burstLimit: number;
  
  // File handling
  maxFileSizeMB: number;
  tempDirectory: string;
  cleanupTempFiles: boolean;
  
  // Quality checks
  validatePDFSignature: boolean;
  minPDFSizeKB: number;
}

export interface LoggingConfig {
  // Log levels
  consoleLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  fileLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  
  // File settings
  logDirectory: string;
  maxLogFileSizeMB: number;
  maxLogFiles: number;
  
  // Output format
  includeTimestamp: boolean;
  includeStackTrace: boolean;
  colorOutput: boolean;
}

export interface MonitoringConfig {
  // Health checks
  enableHealthChecks: boolean;
  healthCheckIntervalMs: number;
  
  // Metrics
  enableMetrics: boolean;
  metricsPort: number;
  
  // Alerting
  enableAlerting: boolean;
  alertThresholds: {
    parseFailureRate: number;
    downloadFailureRate: number;
    memoryUsagePercent: number;
  };
}

export interface CatalogParserConfig {
  environment: 'development' | 'testing' | 'staging' | 'production';
  parsing: ParsingConfig;
  download: DownloadConfig;
  logging: LoggingConfig;
  monitoring: MonitoringConfig;
  
  // Paths
  paths: {
    catalogsDirectory: string;
    parsedDirectory: string;
    outputDirectory: string;
    tempDirectory: string;
    configDirectory: string;
  };
  
  // Feature flags
  features: {
    enableLegacyParsing: boolean;
    enableDetailedDescriptions: boolean;
    enableCCNExtraction: boolean;
    enableCUExtraction: boolean;
    enableDegreePrograms: boolean;
    enableValidation: boolean;
    enableMetrics: boolean;
  };
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: CatalogParserConfig;
  private configPath: string;
  private watchers: Array<(config: CatalogParserConfig) => void> = [];

  private constructor() {
    this.configPath = join(__dirname, '..', 'config', 'catalog-parser.json');
    this.config = this.loadConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private getDefaultConfig(): CatalogParserConfig {
    const environment = (process.env.NODE_ENV as any) || 'development';
    const baseDir = join(__dirname, '..');
    
    return {
      environment,
      parsing: {
        maxRetries: environment === 'production' ? 5 : 3,
        retryDelayMs: environment === 'production' ? 2000 : 1000,
        timeoutMs: environment === 'production' ? 300000 : 120000, // 5min vs 2min
        batchSize: environment === 'production' ? 10 : 5,
        
        minCoursesPerCatalog: 100,
        minCCNsCoveragePercent: 80,
        minCUsCoveragePercent: 70,
        
        memoryLimitMB: environment === 'production' ? 4096 : 2048,
        maxConcurrentParsing: environment === 'production' ? 4 : 2,
        
        preserveDetailedDescriptions: true,
        outputIndentation: environment === 'development' ? 2 : 0,
        compressOutput: environment === 'production'
      },
      
      download: {
        userAgent: 'WGU-Catalog-Parser/2.0 (Educational Research)',
        maxRetries: environment === 'production' ? 5 : 3,
        retryDelayMs: 3000,
        timeoutMs: 180000, // 3 minutes
        
        requestsPerSecond: 2,
        burstLimit: 5,
        
        maxFileSizeMB: 50,
        tempDirectory: join(baseDir, 'temp'),
        cleanupTempFiles: true,
        
        validatePDFSignature: true,
        minPDFSizeKB: 100
      },
      
      logging: {
        consoleLevel: environment === 'development' ? 'DEBUG' : 'INFO',
        fileLevel: 'DEBUG',
        
        logDirectory: join(baseDir, 'logs'),
        maxLogFileSizeMB: 100,
        maxLogFiles: 10,
        
        includeTimestamp: true,
        includeStackTrace: environment !== 'production',
        colorOutput: environment === 'development'
      },
      
      monitoring: {
        enableHealthChecks: environment === 'production',
        healthCheckIntervalMs: 60000, // 1 minute
        
        enableMetrics: environment !== 'development',
        metricsPort: 9090,
        
        enableAlerting: environment === 'production',
        alertThresholds: {
          parseFailureRate: 0.1, // 10%
          downloadFailureRate: 0.05, // 5%
          memoryUsagePercent: 0.85 // 85%
        }
      },
      
      paths: {
        catalogsDirectory: join(baseDir, 'historical', 'catalogs'),
        parsedDirectory: join(baseDir, 'historical', 'parsed'),
        outputDirectory: join(baseDir, 'output'),
        tempDirectory: join(baseDir, 'temp'),
        configDirectory: join(baseDir, 'config')
      },
      
      features: {
        enableLegacyParsing: true,
        enableDetailedDescriptions: true,
        enableCCNExtraction: true,
        enableCUExtraction: true,
        enableDegreePrograms: true,
        enableValidation: environment !== 'development',
        enableMetrics: environment !== 'development'
      }
    };
  }

  private loadConfig(): CatalogParserConfig {
    try {
      if (existsSync(this.configPath)) {
        const configData = readFileSync(this.configPath, 'utf-8');
        const loadedConfig = JSON.parse(configData);
        
        // Merge with defaults to ensure all properties exist
        return this.mergeWithDefaults(loadedConfig);
      }
    } catch (error) {
      console.warn(`Failed to load config from ${this.configPath}:`, error);
    }
    
    // Return defaults if loading fails
    const defaultConfig = this.getDefaultConfig();
    this.saveConfig(defaultConfig);
    return defaultConfig;
  }

  private mergeWithDefaults(loadedConfig: Partial<CatalogParserConfig>): CatalogParserConfig {
    const defaults = this.getDefaultConfig();
    
    // Deep merge function
    const deepMerge = (target: any, source: any): any => {
      const result = { ...target };
      
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = deepMerge(target[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
      
      return result;
    };
    
    return deepMerge(defaults, loadedConfig);
  }

  private saveConfig(config: CatalogParserConfig): void {
    try {
      // Ensure config directory exists
      const configDir = join(this.configPath, '..');
      if (!existsSync(configDir)) {
        require('fs').mkdirSync(configDir, { recursive: true });
      }
      
      writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error(`Failed to save config to ${this.configPath}:`, error);
    }
  }

  public getConfig(): CatalogParserConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<CatalogParserConfig>): void {
    this.config = this.mergeWithDefaults({ ...this.config, ...updates });
    this.saveConfig(this.config);
    
    // Notify watchers
    this.watchers.forEach(watcher => {
      try {
        watcher(this.config);
      } catch (error) {
        console.error('Config watcher error:', error);
      }
    });
  }

  public watch(callback: (config: CatalogParserConfig) => void): () => void {
    this.watchers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.watchers.indexOf(callback);
      if (index > -1) {
        this.watchers.splice(index, 1);
      }
    };
  }

  public validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = this.config;
    
    // Validate parsing config
    if (config.parsing.maxRetries < 1) {
      errors.push('parsing.maxRetries must be at least 1');
    }
    if (config.parsing.timeoutMs < 1000) {
      errors.push('parsing.timeoutMs must be at least 1000ms');
    }
    if (config.parsing.batchSize < 1) {
      errors.push('parsing.batchSize must be at least 1');
    }
    
    // Validate download config
    if (config.download.maxFileSizeMB < 1) {
      errors.push('download.maxFileSizeMB must be at least 1');
    }
    if (config.download.requestsPerSecond < 0.1) {
      errors.push('download.requestsPerSecond must be at least 0.1');
    }
    
    // Validate paths exist
    try {
      if (!existsSync(config.paths.catalogsDirectory)) {
        errors.push(`catalogsDirectory does not exist: ${config.paths.catalogsDirectory}`);
      }
    } catch (error) {
      errors.push(`Cannot access catalogsDirectory: ${config.paths.catalogsDirectory}`);
    }
    
    // Validate thresholds
    if (config.parsing.minCCNsCoveragePercent < 0 || config.parsing.minCCNsCoveragePercent > 100) {
      errors.push('minCCNsCoveragePercent must be between 0 and 100');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public resetToDefaults(): void {
    this.config = this.getDefaultConfig();
    this.saveConfig(this.config);
  }

  public exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  public importConfig(configJson: string): void {
    try {
      const importedConfig = JSON.parse(configJson);
      this.updateConfig(importedConfig);
    } catch (error) {
      throw new Error(`Invalid config JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Environment-specific getters
  public isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  public isProduction(): boolean {
    return this.config.environment === 'production';
  }

  public isTesting(): boolean {
    return this.config.environment === 'testing';
  }
}

// Export singleton instance
export const config = ConfigManager.getInstance();

// CLI interface for configuration management
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const configManager = ConfigManager.getInstance();
  
  switch (command) {
    case 'show':
      console.log('Current Configuration:');
      console.log(configManager.exportConfig());
      break;
      
    case 'validate':
      const validation = configManager.validateConfig();
      console.log('Configuration Validation:');
      console.log('Valid:', validation.isValid);
      if (!validation.isValid) {
        console.log('Errors:');
        validation.errors.forEach(error => console.log(`  - ${error}`));
        process.exit(1);
      }
      break;
      
    case 'reset':
      console.log('Resetting configuration to defaults...');
      configManager.resetToDefaults();
      console.log('Configuration reset complete.');
      break;
      
    case 'env':
      const currentConfig = configManager.getConfig();
      console.log('Environment:', currentConfig.environment);
      console.log('Production Mode:', configManager.isProduction());
      console.log('Development Mode:', configManager.isDevelopment());
      break;
      
    default:
      console.log('Usage: npx tsx config.ts [show|validate|reset|env]');
      console.log('  show     - Display current configuration');
      console.log('  validate - Validate current configuration');
      console.log('  reset    - Reset to default configuration');
      console.log('  env      - Show environment information');
  }
}
