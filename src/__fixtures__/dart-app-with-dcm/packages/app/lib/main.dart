import 'package:core/core.dart';

/// Main entry point for the application
void main() {
  // Create a user
  const user = User('Alice Smith', 'alice@example.com');
  
  // Greet the user
  print(user.greet());
  
  // Validate email
  if (user.isEmailValid()) {
    print('Email is valid: ${user.email}');
  }
  
  // Use utility functions
  final formattedName = formatName('alice smith');
  print('Formatted name: $formattedName');
  
  // Check if name is not empty
  if (isNotEmpty(user.name)) {
    print('User has a name');
  }
  
  // Calculate a simple hash
  final hash = simpleHash(user.email);
  print('Email hash: $hash');
}
