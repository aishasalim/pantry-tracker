// pages/signin.js
import { SignIn } from '@clerk/clerk-react';

const SignInPage = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <SignIn
        path="/signin"
        routing="path"
        signUpUrl="/signup"
        afterSignInUrl="/"
      />
    </div>
  );
};

export default SignInPage;
