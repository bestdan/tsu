/// A simple user model class
class User {
  /// The user's name
  final String name;
  
  /// The user's email address
  final String email;

  /// Creates a new user with the given [name] and [email]
  const User(this.name, this.email);

  /// Returns a greeting message for the user
  String greet() {
    return 'Hello, $name!';
  }

  /// Validates if the email is in a basic valid format
  /// Note: This is intentionally simplified for testing purposes
  /// and not meant to be a production-ready email validator
  bool isEmailValid() {
    return email.contains('@') && email.contains('.');
  }
}
