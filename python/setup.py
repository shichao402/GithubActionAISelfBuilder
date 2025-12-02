"""Setup script for GitHub Action Builder"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="github-action-builder",
    version="1.0.0",
    author="Your Name",
    description="GitHub Action 构建脚手架工具 - Python 版本",
    long_description=long_description,
    long_description_content_type="text/markdown",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.11",
    install_requires=[
        "pyyaml>=6.0",
        "requests>=2.31.0",
    ],
    extras_require={
        "dev": [
            "mypy>=1.0.0",
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "scaffold=scaffold:main",
        ],
    },
)

