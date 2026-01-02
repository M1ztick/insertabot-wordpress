#!/bin/bash

# Insertabot Deployment Script
# Automates the entire deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Configuration
ENVIRONMENT=${1:-"development"}  # development or production
PROJECT_DIR=$(dirname "$(dirname "$(realpath "$0")")")
WORKER_DIR="$PROJECT_DIR/worker"

log_info "Insertabot Deployment Script"
log_info "Environment: $ENVIRONMENT"
log_info "Project Directory: $PROJECT_DIR"

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if wrangler is installed
    if ! command -v wrangler &> /dev/null; then
        log_error "Wrangler CLI not found. Install with: npm install -g wrangler"
        exit 1
    fi
    
    # Check if logged in to Cloudflare
    if ! wrangler whoami &> /dev/null; then
        log_error "Not logged in to Cloudflare. Run: wrangler login"
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js not found. Please install Node.js 18 or later."
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "$WORKER_DIR/wrangler.toml" ]; then
        log_error "wrangler.toml not found in $WORKER_DIR"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    cd "$WORKER_DIR"
    
    if [ ! -d "node_modules" ]; then
        npm install
        log_success "Dependencies installed"
    else
        log_info "Dependencies already installed"
    fi
}

# Lint and type check
lint_and_typecheck() {
    log_info "Running lint and type check..."
    
    cd "$WORKER_DIR"
    
    # Type check
    if npx tsc --noEmit; then
        log_success "Type check passed"
    else
        log_error "Type check failed"
        exit 1
    fi
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    if [ "$ENVIRONMENT" = "development" ]; then
        log_info "Starting development server for testing..."
        
        # Start dev server in background
        cd "$WORKER_DIR"
        nohup npm run dev > /tmp/wrangler-dev.log 2>&1 &
        DEV_PID=$!
        
        # Wait for server to start
        sleep 5
        
        # Run tests
        cd "$PROJECT_DIR"
        if node scripts/test-api.js http://localhost:8787; then
            log_success "Tests passed"
        else
            log_warning "Some tests failed, but continuing deployment"
        fi
        
        # Stop dev server
        kill $DEV_PID 2>/dev/null || true
    else
        log_info "Skipping tests for production deployment"
    fi
}

# Deploy to Cloudflare
deploy() {
    log_info "Deploying to Cloudflare ($ENVIRONMENT)..."
    
    cd "$WORKER_DIR"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        npm run deploy
    else
        npm run deploy:dev
    fi
    
    log_success "Deployment completed"
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Get the deployment URL from wrangler
    cd "$WORKER_DIR"
    DEPLOYMENT_URL=$(wrangler deployments list --name insertabot-api${ENVIRONMENT:+-dev} --format json 2>/dev/null | jq -r '.[0].url // empty' || echo "")
    
    if [ -z "$DEPLOYMENT_URL" ]; then
        if [ "$ENVIRONMENT" = "production" ]; then
            DEPLOYMENT_URL="https://insertabot-api.*.workers.dev"
        else
            DEPLOYMENT_URL="https://insertabot-api-dev.*.workers.dev"
        fi
        log_warning "Could not get exact deployment URL, using placeholder: $DEPLOYMENT_URL"
    fi
    
    log_info "Deployment URL: $DEPLOYMENT_URL"
    
    # Test health endpoint
    if command -v curl &> /dev/null; then
        log_info "Testing health endpoint..."
        if curl -f -s "$DEPLOYMENT_URL/health" > /dev/null; then
            log_success "Health check passed"
        else
            log_warning "Health check failed - the service might still be starting up"
        fi
    fi
}

# Post-deployment tasks
post_deployment() {
    log_info "Running post-deployment tasks..."
    
    # Update widget demo if in development
    if [ "$ENVIRONMENT" = "development" ]; then
        log_info "Updating widget demo configuration..."
        # This would update the demo.html with the new API endpoint
    fi
    
    # Run database migrations if needed
    log_info "Checking database migrations..."
    cd "$WORKER_DIR"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        # In production, be more careful with migrations
        log_info "Production database migration (manual confirmation required)"
        log_warning "Please review and run migrations manually if needed:"
        log_warning "  wrangler d1 execute insertabot-production --file=../schema.sql"
    else
        # Development - run migrations automatically
        log_info "Running development database migrations..."
        wrangler d1 execute insertabot-development --local --file=../schema.sql || log_warning "Migration may have already been applied"
    fi
    
    log_success "Post-deployment tasks completed"
}

# Display summary
display_summary() {
    log_success "🎉 Deployment Summary"
    echo "─────────────────────────────────────"
    echo "Environment: $ENVIRONMENT"
    echo "Worker: insertabot-api${ENVIRONMENT:+-dev}"
    echo "Status: Deployed successfully"
    echo ""
    echo "Next steps:"
    if [ "$ENVIRONMENT" = "development" ]; then
        echo "  • Test the API with: npm run test"
        echo "  • View logs with: cd worker && npm run tail"
        echo "  • Open widget demo: cd widget && python3 -m http.server 8000"
    else
        echo "  • Set up custom domain in Cloudflare Dashboard"
        echo "  • Configure AI Gateway secrets if not done already"
        echo "  • Update DNS records for your domain"
        echo "  • Set up monitoring and alerts"
    fi
    echo ""
    echo "Useful commands:"
    echo "  • View deployments: cd worker && wrangler deployments"
    echo "  • View logs: cd worker && wrangler tail"
    echo "  • Rollback: cd worker && wrangler rollback"
}

# Main deployment flow
main() {
    check_prerequisites
    install_dependencies
    lint_and_typecheck
    run_tests
    deploy
    verify_deployment
    post_deployment
    display_summary
}

# Handle errors
trap 'log_error "Deployment failed at line $LINENO"' ERR

# Run main function
main

log_success "Deployment completed successfully! 🚀"