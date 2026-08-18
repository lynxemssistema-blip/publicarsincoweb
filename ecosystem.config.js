module.exports = {
  apps: [
    {
      name: "sincoweb-api",
      script: "./src/server.js",
      instances: 1, // Pode aumentar depois se o VPS tiver muitos cores
      exec_mode: "fork", // 'cluster' é melhor para multi-core
      env: {
        NODE_ENV: "production",
      },
      watch: false, // Não queremos que o servidor reinicie sozinho em produção se algo mudar na pasta
      max_memory_restart: "1G", // Reinicia a aplicação se ela gastar mais de 1GB de RAM (previne travamentos)
      error_file: "./logs/err.log", // Logs de erro
      out_file: "./logs/out.log", // Logs normais
      log_date_format: "YYYY-MM-DD HH:mm Z",
      merge_logs: true,
    }
  ]
};
