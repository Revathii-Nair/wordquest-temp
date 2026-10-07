import { Amplify } from "aws-amplify";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "ap-south-1_XUnNSjsub",
      userPoolClientId: "388ic5mifocpkc420jtp51e55a",
      loginWith: {
        username: true,
        email: true,
        oauth: {
          domain: "ap-south-1xunnsjsub.auth.ap-south-1.amazoncognito.com",
          scopes: ["openid", "email"],
          redirectSignIn: ["https://wordquest-tau.vercel.app"],
          redirectSignOut: ["https://wordquest-tau.vercel.app"],
          responseType: "code",
        },
      },
    },
  },
});
