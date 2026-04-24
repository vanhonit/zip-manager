#!/bin/bash

# Deploy to GitHub Pages - Static Branch Method

set -e

# Store current branch
CURRENT_BRANCH=$(git branch --show-current)

echo "Building Jekyll site..."
cd docs
jekyll build --destination ../_site
cd ..

echo "Creating clean gh-pages branch..."
# Check if gh-pages branch exists locally
if git show-ref --verify --quiet refs/heads/gh-pages; then
    echo "Deleting existing gh-pages branch..."
    git branch -D gh-pages
fi

# Create new orphan branch for gh-pages
git checkout --orphan gh-pages

# Remove all files from staging area
echo "Cleaning working directory..."
git rm -rf .

# Copy only the built Jekyll site files
echo "Copying built files..."
cp -r _site/. .
git add .

# Clean up temporary build directory
rm -rf _site

echo "Committing changes..."
git commit -m "Deploy to GitHub Pages - $(date '+%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"

echo "Pushing to gh-pages branch..."
git push origin gh-pages --force

echo "Switching back to $CURRENT_BRANCH branch..."
git checkout "$CURRENT_BRANCH"

echo "Done! Your site is now deployed to the gh-pages branch."
echo "Configure GitHub Pages to serve from the 'gh-pages' branch in your repository settings."