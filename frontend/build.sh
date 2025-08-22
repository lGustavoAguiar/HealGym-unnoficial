# Render Build Script
echo "Building React app for production..."
npm run build

# Verificar se o build foi criado
echo "Checking build directory..."
ls -la dist/

echo "Build completed successfully!"
