import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig = {
  transpilePackages: ["@m2/ui", "@m2/design", "@m2/i18n", "@m2/api-client"],
};

export default withNextIntl(nextConfig);
