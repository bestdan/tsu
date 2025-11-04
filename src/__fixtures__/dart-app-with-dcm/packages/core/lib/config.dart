/// A configuration class to test DCM rules
class Config {
  /// The application name
  final String appName;
  
  /// The version number
  final String version;
  
  /// Debug mode flag
  final bool debugMode;

  /// Creates a new configuration
  /// This violates prefer-trailing-comma rule - no trailing comma
  const Config(
    this.appName,
    this.version,
    this.debugMode
  );

  /// Returns a configuration map
  /// This also violates prefer-trailing-comma - no trailing comma in map
  Map<String, dynamic> toMap() {
    return {
      'appName': appName,
      'version': version,
      'debugMode': debugMode
    };
  }

  /// Creates a Config from a map
  /// This also violates prefer-trailing-comma - no trailing comma in constructor
  factory Config.fromMap(Map<String, dynamic> map) {
    return Config(
      map['appName'] as String,
      map['version'] as String,
      map['debugMode'] as bool
    );
  }
}
