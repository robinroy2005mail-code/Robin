import os
import base64
import json
import urllib.request
import urllib.error

# Config
REPO_OWNER = "robinroy2005mail-code"
REPO_NAME = "Robin"
BRANCH = "main"

# Folders/files to ignore
IGNORE_FOLDERS = {'.git', '__pycache__', 'venv', '.venv', 'env', '.gemini'}
IGNORE_FILES = {'database.db', 'upload_to_github.py'} # Exclude local db and this upload script

def get_files_to_upload(root_dir):
    files_to_upload = []
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Modify dirnames in-place to skip ignored folders
        dirnames[:] = [d for d in dirnames if d not in IGNORE_FOLDERS]
        
        for filename in filenames:
            if filename in IGNORE_FILES:
                continue
            if filename.endswith('.pyc') or filename.endswith('.pyo'):
                continue
                
            full_path = os.path.join(dirpath, filename)
            rel_path = os.path.relpath(full_path, root_dir).replace('\\', '/')
            files_to_upload.append((full_path, rel_path))
    return files_to_upload

def get_file_sha(token, rel_path):
    """Checks if file exists in the repo and returns its SHA value."""
    url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/contents/{rel_path}?ref={BRANCH}"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"token {token}")
    req.add_header("Accept", "application/vnd.github.v3+json")
    
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            return data.get('sha')
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None # File doesn't exist
        print(f"Error checking status for {rel_path}: HTTP {e.code}")
        return None
    except Exception as e:
        print(f"Error checking status for {rel_path}: {e}")
        return None

def upload_file(token, local_path, rel_path, sha=None):
    """Uploads a file to GitHub repository."""
    url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/contents/{rel_path}"
    
    with open(local_path, 'rb') as f:
        content = base64.b64encode(f.read()).decode('utf-8')
        
    payload = {
        "message": f"Upload {rel_path} via API helper",
        "content": content,
        "branch": BRANCH
    }
    if sha:
        payload["sha"] = sha
        
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, method="PUT")
    req.add_header("Authorization", f"token {token}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Accept", "application/vnd.github.v3+json")
    
    try:
        with urllib.request.urlopen(req) as response:
            return response.status == 200 or response.status == 201
    except urllib.error.HTTPError as e:
        print(f"Failed to upload {rel_path}: HTTP {e.code} - {e.read().decode()}")
        return False
    except Exception as e:
        print(f"Failed to upload {rel_path}: {e}")
        return False

def main():
    print("="*60)
    print("      GITHUB DIRECT UPLOAD HELPER (NO GIT REQUIRED)")
    print("="*60)
    print(f"Repository: https://github.com/{REPO_OWNER}/{REPO_NAME}")
    print(f"Target Branch: {BRANCH}\n")
    
    token = input("Enter your GitHub Personal Access Token (PAT): ").strip()
    if not token:
        print("Error: Personal Access Token is required.")
        return
        
    project_dir = os.path.dirname(os.path.abspath(__file__))
    files = get_files_to_upload(project_dir)
    
    print(f"\nFound {len(files)} files to upload. Starting process...\n")
    
    success_count = 0
    for idx, (local_path, rel_path) in enumerate(files, 1):
        print(f"[{idx}/{len(files)}] Processing {rel_path}...", end="", flush=True)
        
        # Check if file exists to get SHA for updates
        sha = get_file_sha(token, rel_path)
        
        # Upload/Update
        success = upload_file(token, local_path, rel_path, sha)
        if success:
            print(" Uploaded successfully.")
            success_count += 1
        else:
            print(" Failed to upload.")
            
    print("\n" + "="*60)
    print(f"Upload Complete! {success_count}/{len(files)} files successfully pushed.")
    print("="*60)

if __name__ == '__main__':
    main()
