"""
环境设置构建器

负责构建工作流的环境设置配置，包括 Actions、Steps 和缓存。
"""

from typing import Dict, Optional, Any, List


class SetupBuilder:
    """环境设置构建器"""
    
    def __init__(self) -> None:
        self._actions: List[Dict[str, Any]] = []
        self._steps: List[Dict[str, Any]] = []
        self._caches: List[Dict[str, Any]] = []
        self._python_version: Optional[str] = None
    
    def setup_python(
        self,
        version: str = "3.11",
        cache: Optional[str] = None
    ) -> "SetupBuilder":
        """设置 Python 环境"""
        action: Dict[str, Any] = {
            "name": "Set up Python",
            "uses": "actions/setup-python@v4",
            "with": {
                "python-version": version,
            },
        }
        if cache:
            action["with"]["cache"] = cache
        self._actions.append(action)
        self._python_version = version
        return self
    
    def setup_node(
        self,
        version: str = "18",
        cache: Optional[str] = None
    ) -> "SetupBuilder":
        """设置 Node.js 环境"""
        action: Dict[str, Any] = {
            "name": "Set up Node.js",
            "uses": "actions/setup-node@v3",
            "with": {
                "node-version": version,
            },
        }
        if cache:
            action["with"]["cache"] = cache
        self._actions.append(action)
        return self
    
    def setup_java(
        self,
        version: str = "17",
        distribution: str = "temurin",
        cache: Optional[str] = None
    ) -> "SetupBuilder":
        """设置 Java 环境"""
        action: Dict[str, Any] = {
            "name": "Set up Java",
            "uses": "actions/setup-java@v3",
            "with": {
                "distribution": distribution,
                "java-version": version,
            },
        }
        if cache:
            action["with"]["cache"] = cache
        self._actions.append(action)
        return self
    
    def setup_flutter(
        self,
        version: str = "3.16.0",
        channel: str = "stable",
        cache: bool = True
    ) -> "SetupBuilder":
        """设置 Flutter 环境"""
        self._actions.append({
            "name": "Set up Flutter",
            "uses": "subosito/flutter-action@v2",
            "with": {
                "flutter-version": version,
                "channel": channel,
                "cache": cache,
            },
        })
        return self
    
    def add_action(
        self,
        name: str,
        uses: str,
        with_params: Optional[Dict[str, Any]] = None
    ) -> "SetupBuilder":
        """添加自定义设置 Action"""
        action: Dict[str, Any] = {
            "name": name,
            "uses": uses,
        }
        if with_params:
            action["with"] = with_params
        self._actions.append(action)
        return self
    
    def add_step(self, name: str, run: str) -> "SetupBuilder":
        """添加自定义设置步骤"""
        self._steps.append({
            "name": name,
            "run": run,
        })
        return self
    
    def cache_pip(self, key_file: str = "**/requirements.txt") -> "SetupBuilder":
        """添加 pip 缓存"""
        self._caches.append({
            "name": "pip",
            "path": "~/.cache/pip",
            "key": f"${{{{ runner.os }}}}-pip-${{{{ hashFiles('{key_file}') }}}}",
        })
        return self
    
    def cache_npm(self, key_file: str = "**/package-lock.json") -> "SetupBuilder":
        """添加 npm 缓存"""
        self._caches.append({
            "name": "npm",
            "path": "~/.npm",
            "key": f"${{{{ runner.os }}}}-npm-${{{{ hashFiles('{key_file}') }}}}",
        })
        return self
    
    def cache_gradle(
        self,
        key_files: List[str] = None
    ) -> "SetupBuilder":
        """添加 Gradle 缓存"""
        if key_files is None:
            key_files = ["**/*.gradle*", "**/gradle-wrapper.properties"]
        key_files_str = ", ".join([f"'{f}'" for f in key_files])
        self._caches.append({
            "name": "gradle",
            "path": "~/.gradle",
            "key": f"${{{{ runner.os }}}}-gradle-${{{{ hashFiles({key_files_str}) }}}}",
        })
        return self
    
    def add_cache(
        self,
        name: str,
        cache_path: str,
        key: str,
        restore_keys: Optional[List[str]] = None
    ) -> "SetupBuilder":
        """添加自定义缓存"""
        cache: Dict[str, Any] = {
            "name": name,
            "path": cache_path,
            "key": key,
        }
        if restore_keys:
            cache["restore-keys"] = restore_keys
        self._caches.append(cache)
        return self
    
    def build(self) -> Dict[str, Any]:
        """构建 SetupConfig"""
        config: Dict[str, Any] = {}
        
        if self._actions:
            config["actions"] = self._actions
        
        if self._steps:
            config["steps"] = self._steps
        
        if self._caches:
            config["caches"] = self._caches
        
        return config
    
    def get_python_version(self) -> Optional[str]:
        """获取 Python 版本"""
        return self._python_version

