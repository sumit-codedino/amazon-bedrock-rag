interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
}

export const Card = ({
  children,
  variant = "default",
  padding = "md",
  className = "",
  ...props
}: CardProps) => {
  const baseClasses = "rounded-xl bg-white dark:bg-gray-800";

  const variantClasses = {
    default: "border border-gray-200 dark:border-gray-700",
    elevated: "shadow-lg",
  };

  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
