require 'open3'
require 'time'

module Jekyll
  class WritingMetadataGenerator < Generator
    safe true
    priority :low

    def generate(site)
      writing = site.collections['writing']
      return unless writing

      writing.docs.each do |doc|
        next unless live_post?(doc)

        doc.data['first_live_at'] ||= discover_first_live(site, doc)
        doc.data['title'] = derive_title(doc) if missing?(doc.data['title'])
      end
    end

    private

    def live_post?(doc)
      status = doc.data['status']
      status = status.downcase if status.respond_to?(:downcase)
      status == 'live'
    end

    def missing?(value)
      value.nil? || (value.respond_to?(:empty?) && value.empty?)
    end

    def derive_title(doc)
      doc.content.to_s.each_line do |line|
        stripped = line.strip
        next unless stripped.start_with?('# ')

        return stripped.sub(/^#\s+/, '').strip
      end
      nil
    end

    def discover_first_live(site, doc)
      return unless git_available?

      path = File.expand_path(doc.path, site.source)
      command = ['git', 'log', '--diff-filter=A', '--follow', '--format=%aI', '-1', '--', path]
      stdout, status = Open3.capture2(*command)
      return unless status.success?

      stamp = stdout.strip
      stamp.empty? ? nil : Time.parse(stamp)
    rescue StandardError => e
      Jekyll.logger.warn('writing_metadata', "Unable to read first-live date for #{doc.relative_path}: #{e.message}")
      nil
    end

    def git_available?
      return @git_available unless @git_available.nil?

      _, status = Open3.capture2('git', 'rev-parse', '--is-inside-work-tree')
      @git_available = status.success?
    end
  end
end
