const Footer = () => {
  return (
    <footer className="border-t border-border bg-background py-4 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-muted-foreground">
          Made with love by{" "}
          <a
            href="https://advisable.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline transition-colors"
          >
            Advisable.com
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
