/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";
const repoName = "general";

const base = isProd ? `/${repoName}` : "";

const nextConfig = {
  output: "export",
  basePath: base,
  assetPrefix: isProd ? `/${repoName}/` : "",
  env: {
    NEXT_PUBLIC_BASE_PATH: base,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    config.module.rules.push({
      test: /\.mjs$/,
      type: "javascript/esm",
      resolve: { fullySpecified: false },
    });

    config.resolve.alias = {
      ...config.resolve.alias,
      "onnxruntime-node$": false,
    };

    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
    };
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

export default nextConfig;
