import 'package:core/user.dart';

void main() {
  // Test user creation
  const user = User('John Doe', 'john@example.com');
  
  // Test greet method
  final greeting = user.greet();
  assert(greeting == 'Hello, John Doe!', 'Greeting should match expected format');
  
  // Test email validation
  assert(user.isEmailValid(), 'Email should be valid');
  
  // Test invalid email
  const invalidUser = User('Jane', 'invalid-email');
  assert(!invalidUser.isEmailValid(), 'Invalid email should fail validation');
  
  print('All user tests passed!');
}
