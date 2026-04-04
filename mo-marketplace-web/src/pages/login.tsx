import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { login } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@/components";

const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login = () => {
  const navigate = useNavigate();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const res = await login(values);

      setAccessToken(res.data.accessToken);
      navigate("/products", { replace: true });
    } catch (error) {
      const errorMessage = getApiErrorMessage(
        error,
        "Invalid email or password",
      );

      setError("root", {
        message: errorMessage,
      });
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center bg-muted/30 px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80rem_30rem_at_50%_-10%,oklch(0.97_0_0),transparent)]" />

      <Card className="relative z-10 w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to continue to the marketplace.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {errors.root?.message && (
              <p className="text-sm text-destructive">{errors.root.message}</p>
            )}

            <Button
              className="mt-2 w-full"
              size="lg"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>

            <p className="text-muted-foreground text-center text-sm">
              Do not have an account?{" "}
              <Link
                className="text-foreground underline underline-offset-4"
                to="/register"
              >
                Register
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
};
