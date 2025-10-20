const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-background py-4 z-50">
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
