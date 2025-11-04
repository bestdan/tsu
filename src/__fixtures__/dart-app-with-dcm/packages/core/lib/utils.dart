/// Utility functions for the core package

/// Formats a name to title case
String formatName(String name) {
  if (name.isEmpty) {
    return name;
  }
  
  return name
      .split(' ')
      .map((word) => word.isEmpty 
          ? word 
          : '${word[0].toUpperCase()}${word.substring(1).toLowerCase()}')
      .join(' ');
}

/// Validates if a string is not empty or null
bool isNotEmpty(String? value) {
  return value != null && value.isNotEmpty;
}

/// Calculates a simple hash for a string
int simpleHash(String input) {
  int hash = 0;
  for (int i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.codeUnitAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}
